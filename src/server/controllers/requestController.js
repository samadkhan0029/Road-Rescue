import bcrypt from 'bcryptjs';
import ServiceRequest from '../models/ServiceRequest.js';
import User from '../models/User.js';
import { emitProviderRequest, emitRequestUpdate } from '../socket/socketStore.js';
import { findNearestProvider, calculateCompleteFareData } from '../utils/findNearestProvider.js';

const RADIUS_METERS = 5000;
const EARTH_RADIUS_METERS = 6378137;

const ensureCustomer = async ({ reqUser, customerName, customerPhone }) => {
  if (reqUser?._id) {
    return reqUser;
  }

  const randomId = Date.now().toString(36);
  const password = await bcrypt.hash(`guest-${randomId}`, 10);
  return User.create({
    name: customerName || `Guest ${randomId}`,
    email: `guest-${randomId}@roadrescue.local`,
    phone: customerPhone,
    password,
    role: 'customer',
  });
};

const buildProviderPayload = (request) => ({
  requestId: request._id,
  customerName: request.customerName,
  customerPhone: request.customerPhone,
  serviceType: request.serviceType,
  locationName: request.locationName,
  coords: request.coords,
  createdAt: request.createdAt,
  message: `Emergency help requested: ${request.serviceType} near ${request.locationName}`,
});

export const offerToNextProvider = async (requestDoc) => {
  const lng = Number(requestDoc.location.coordinates[0]);
  const lat = Number(requestDoc.location.coordinates[1]);
  const ignored = requestDoc.ignoredBy || [];

  const next = await findNearestProvider(lng, lat, ignored);
  requestDoc.currentOfferProvider = next ? next._id : null;

  if (!next) {
    requestDoc.status = 'ignored';
    await requestDoc.save();
    emitRequestUpdate(requestDoc._id.toString(), 'NO_PROVIDER', {
      message: 'No providers available nearby after refusals',
    });
    return requestDoc;
  }

  requestDoc.status = 'pending';
  await requestDoc.save();
  console.log('🚨 EMERGENCY REQUEST EMITTED to provider:', next._id.toString(), 'Request ID:', requestDoc._id);
  emitProviderRequest(next._id.toString(), buildProviderPayload(requestDoc));
  return requestDoc;
};

export const createRequest = async (req, res, next) => {
  try {
    const { locationName, coords, serviceType, location, address, customerName, customerPhone } = req.body;
    const normalizedCoords = coords || location;
    const normalizedLocationName = locationName || address;

    if (
      !normalizedLocationName ||
      !normalizedCoords ||
      normalizedCoords.lat === undefined ||
      normalizedCoords.lng === undefined ||
      !serviceType
    ) {
      return res.status(400).json({
        success: false,
        error: 'locationName, coords.lat, coords.lng, and serviceType are required',
      });
    }

    const customer = await ensureCustomer({
      reqUser: req.user,
      customerName,
      customerPhone,
    });

    // Find nearest provider to calculate distance
    const nearestProviderForFare = await findNearestProvider(normalizedCoords.lng, normalizedCoords.lat);
    
    // Calculate fare data
    let fareData = {
      distance: 0,
      baseFee: 500,
      distanceCharge: 0,
      totalFare: 600,
      serviceType: serviceType,
      ratePerKm: 50,
      minFare: 600
    };

    if (nearestProviderForFare) {
      try {
        // Calculate fare based on distance to nearest provider
        const providerCoords = {
          lat: nearestProviderForFare.location.coordinates[1],
          lng: nearestProviderForFare.location.coordinates[0]
        };
        fareData = await calculateCompleteFareData(providerCoords, normalizedCoords, serviceType);
      } catch (error) {
        console.error('Error calculating fare for request:', error);
        // Use default fare data if calculation fails
      }
    }

    const request = await ServiceRequest.create({
      customer: customer._id,
      provider: null,
      currentOfferProvider: null,
      status: 'pending',
      ignoredBy: [],
      locationName: normalizedLocationName,
      coords: normalizedCoords,
      serviceType,
      location: {
        type: 'Point',
        coordinates: [Number(normalizedCoords.lng), Number(normalizedCoords.lat)],
      },
      customerName: customerName || customer.name,
      customerPhone: customerPhone || customer.phone,
      // Add fare data to the request
      distance: fareData.distance,
      baseFee: fareData.baseFee,
      distanceCharge: fareData.distanceCharge,
      totalFare: fareData.totalFare,
      ratePerKm: fareData.ratePerKm,
      minFare: fareData.minFare,
    });

    // Customer UX: let them know we're searching immediately.
    emitRequestUpdate(request._id.toString(), 'SEARCHING', {
      message: 'Searching for nearby providers...',
    });

    // Provider UX: popup the nearest provider immediately.
    const nearestProvider = await findNearestProvider(
      Number(normalizedCoords.lng),
      Number(normalizedCoords.lat),
      []
    );

    if (nearestProvider) {
      request.currentOfferProvider = nearestProvider._id;
      await request.save();
      emitProviderRequest(nearestProvider._id.toString(), buildProviderPayload(request));
    }

    const fresh = await ServiceRequest.findById(request._id);

    res.status(201).json({
      success: true,
      request: fresh,
      message: 'Request submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getRequestStatus = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customer', 'name email role phone')
      .populate('provider', 'name email role phone providerInfo location');

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can accept requests' });
    }

    if (!req.user.location?.coordinates || req.user.location.coordinates.length !== 2) {
      return res.status(400).json({ success: false, error: 'Provider location is required' });
    }

    const request = await ServiceRequest.findOne({
      _id: req.params.id,
      provider: null,
      status: 'pending',
      ignoredBy: { $nin: [req.user._id] },
    });

    if (!request) {
      return res.status(409).json({
        success: false,
        error: 'Request no longer available (already accepted or not pending).',
      });
    }

    // Nearest-provider enforcement: only the closest provider within 5km can accept.
    const reqLng = Number(request.location.coordinates[0]);
    const reqLat = Number(request.location.coordinates[1]);
    const ignoredIds = request.ignoredBy || [];

    const nearestProvider = await findNearestProvider(reqLng, reqLat, ignoredIds);
    if (!nearestProvider) {
      return res.status(409).json({ success: false, error: 'No providers available nearby.' });
    }
    if (String(nearestProvider._id) !== String(req.user._id)) {
      return res.status(409).json({ success: false, error: 'You are not the nearest provider.' });
    }

    const updated = await ServiceRequest.findOneAndUpdate(
      {
        _id: request._id,
        provider: null,
        status: 'pending',
        ignoredBy: { $nin: [req.user._id] },
      },
      {
        $set: {
          status: 'accepted',
          provider: req.user._id,
          currentOfferProvider: null,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ success: false, error: 'Request was accepted by another provider.' });
    }

    const populatedRequest = await ServiceRequest.findById(updated._id)
      .populate('customer', 'name email role phone')
      .populate('provider', 'name email role phone providerInfo location');

    const providerName = populatedRequest.provider?.name || req.user.name;
    const pc = populatedRequest.provider?.location?.coordinates;
    const providerCoords =
      pc?.length === 2 ? { lat: Number(pc[1]), lng: Number(pc[0]) } : undefined;

    emitRequestUpdate(request._id.toString(), 'ACCEPTED', {
      provider: {
        providerName,
        providerId: populatedRequest.provider?._id?.toString(),
        phone: populatedRequest.provider?.phone ?? req.user.phone,
        rating: populatedRequest.provider?.providerInfo?.rating ?? 0,
        serviceType:
          populatedRequest.provider?.providerInfo?.services?.[0] || request.serviceType,
      },
      providerCoords,
      message: `Help is on the way! ${providerName} has accepted your request.`,
      request: {
        _id: populatedRequest._id,
        serviceType: populatedRequest.serviceType,
        distance: populatedRequest.distance,
        baseFee: populatedRequest.baseFee,
        distanceCharge: populatedRequest.distanceCharge,
        totalFare: populatedRequest.totalFare,
        ratePerKm: populatedRequest.ratePerKm,
        minFare: populatedRequest.minFare,
      },
    });

    res.status(200).json({
      success: true,
      request: populatedRequest,
      message: `Help is on the way! ${providerName} has accepted your request.`,
    });
  } catch (error) {
    next(error);
  }
};

export const ignoreRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can ignore requests' });
    }

    const request = await ServiceRequest.findOne({
      _id: req.params.id,
      provider: null,
      status: 'pending',
    });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const alreadyIgnored = (request.ignoredBy || []).some((id) => id.toString() === req.user._id.toString());
    if (!alreadyIgnored) {
      request.ignoredBy = [...(request.ignoredBy || []), req.user._id];
    }
    await request.save();

    // Ride-sharing behavior: re-offer to the next nearest provider.
    const reqLng = Number(request.location.coordinates[0]);
    const reqLat = Number(request.location.coordinates[1]);
    const nearestProvider = await findNearestProvider(reqLng, reqLat, request.ignoredBy || []);

    if (nearestProvider) {
      request.currentOfferProvider = nearestProvider._id;
      await request.save();

      emitProviderRequest(nearestProvider._id.toString(), buildProviderPayload(request));
      emitRequestUpdate(request._id.toString(), 'SEARCHING_AGAIN', { message: 'Provider has declined the request. Looking for new providers in your range...' });
    } else {
      request.currentOfferProvider = null;
      await request.save();
      emitRequestUpdate(request._id.toString(), 'NO_PROVIDER', { message: 'No providers available nearby right now.' });
    }

    const fresh = await ServiceRequest.findById(request._id);

    res.status(200).json({
      success: true,
      request: fresh,
    });
  } catch (error) {
    next(error);
  }
};

export const completeRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can complete requests' });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (!request.provider || request.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your active job' });
    }

    request.status = 'completed';
    await request.save();

    emitRequestUpdate(request._id.toString(), 'COMPLETED', { message: 'Job completed' });

    res.status(200).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

export const getProviderActiveJob = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can view active jobs' });
    }

    const request = await ServiceRequest.findOne({
      provider: req.user._id,
      status: 'accepted',
    })
      .sort({ updatedAt: -1 })
      .populate('customer', 'name phone email');

    return res.status(200).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

export const getAvailableRequests = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can view available requests' });
    }

    if (!req.user.location?.coordinates || req.user.location.coordinates.length !== 2) {
      return res.status(400).json({ success: false, error: 'Provider location is required' });
    }

    const providerLng = Number(req.user.location.coordinates[0]);
    const providerLat = Number(req.user.location.coordinates[1]);

    const requests = await ServiceRequest.find({
      status: 'pending',
      provider: null,
      ignoredBy: { $nin: [req.user._id] },
      $or: [{ currentOfferProvider: req.user._id }, { currentOfferProvider: null }],
      location: {
        $geoWithin: {
          $centerSphere: [
            [providerLng, providerLat],
            RADIUS_METERS / EARTH_RADIUS_METERS,
          ],
        },
      },
    })
      .sort({ createdAt: -1 })
      .populate('customer', 'name phone');

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// Location-aware provider polling:
// - Uses provider auth (req.user) but reads coordinates from the request query params.
// - Ensures provider sees pending requests within 5km even if GPS isn't persisted yet.
export const getAvailableRequestsNearby = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can view available requests' });
    }

    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, error: 'lat and lng query params are required' });
    }

    const requests = await ServiceRequest.find({
      status: 'pending',
      provider: null,
      ignoredBy: { $nin: [req.user._id] },
      $or: [{ currentOfferProvider: req.user._id }, { currentOfferProvider: null }],
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat], // [lng, lat]
          },
          $maxDistance: RADIUS_METERS,
        },
      },
    })
      .sort({ createdAt: -1 })
      .populate('customer', 'name phone');

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

export const cancelRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can cancel requests' });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (!request.provider || request.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your active job' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ success: false, error: 'Can only cancel accepted requests' });
    }

    // Mark cancelled and remove provider
    request.status = 'cancelled';
    request.provider = null;
    request.currentOfferProvider = null;
    await request.save();

    // Notify customer that the provider cancelled
    emitRequestUpdate(request._id.toString(), 'CANCELLED', {
      message: 'Provider has cancelled the job. Looking for new providers in range...',
    });

    res.status(200).json({
      success: true,
      request,
      message: 'Job cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRequestByCustomer = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Auth check rules:
    // - No auth (guest)      → pass; knowing the requestId is implicit proof
    // - Authenticated user   → must be the customer who created the request
    if (req.user && String(request.customer) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'You can only cancel your own requests',
      });
    }

    // Only allow cancellation of pending / accepted requests
    if (request.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel a completed request',
      });
    }

    const hadProvider = !!request.provider;

    // Mark cancelled so it won't be offered again
    request.status = 'cancelled';
    request.provider = null;
    request.currentOfferProvider = null;
    await request.save();

    // Notify the assigned provider (if any) that the customer cancelled
    if (hadProvider) {
      emitRequestUpdate(request._id.toString(), 'CUSTOMER_CANCELLED', {
        message: 'Customer has cancelled the request',
      });
    }

    res.status(200).json({
      success: true,
      request,
      message: 'Request cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getRequestById = getRequestStatus;

export const getCustomerHistory = async (req, res, next) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ success: false, error: 'Only customers can view their request history' });
    }

    const requests = await ServiceRequest.find({ customer: req.user._id })
      .populate('provider', 'name phone providerInfo')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedHistory = requests.map(request => ({
      _id: request._id,
      serviceType: request.serviceType,
      status: request.status,
      completedAt: request.updatedAt,
      cancelledAt: request.status === 'cancelled' ? request.updatedAt : null,
      updatedAt: request.updatedAt,
      createdAt: request.createdAt,
      assignedProvider: request.provider ? {
        providerName: request.provider.name,
        phone: request.provider.phone
      } : null,
      location: {
        address: request.locationName
      },
      fare: {
        totalFare: request.totalFare || 0
      }
    }));

    res.status(200).json({ 
      success: true, 
      requests: formattedHistory 
    });
  } catch (error) {
    next(error);
  }
};

/* global process */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const formatRoleForClient = (role) => (role === 'customer' ? 'user' : role);
const mapRoleToDb = (role) => (role === 'user' ? 'customer' : role);
const toClientUser = (user) => ({
  _id: user._id,
  name: user.name,
  fullName: user.name,
  email: user.email,
  phone: user.phone,
  role: formatRoleForClient(user.role),
  providerInfo: user.providerInfo,
});

export const register = async (req, res, next) => {
  try {
    const { name, fullName, email, password, role, phone, providerInfo, currentLocation, serviceType } = req.body;
    const resolvedName = name || fullName;

    if (!resolvedName || !email || !password) {
      return res.status(400).json({ success: false, error: 'name, email, and password are required' });
    }

    const normalizedRole = mapRoleToDb(role || 'customer');
    if (!['customer', 'provider'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let providerPayload;
    let providerLocation;
    if (normalizedRole === 'provider') {
      const services = Array.isArray(providerInfo?.services)
        ? providerInfo.services
        : serviceType
          ? [serviceType]
          : [];

      providerPayload = {
        ...providerInfo,
        services,
      };

      if (currentLocation?.lat !== undefined && currentLocation?.lng !== undefined) {
        providerLocation = {
          type: 'Point',
          coordinates: [Number(currentLocation.lng), Number(currentLocation.lat)],
        };
      }
    }

    const user = await User.create({
      name: resolvedName,
      email,
      password: hashedPassword,
      phone,
      role: normalizedRole,
      providerInfo: normalizedRole === 'provider' ? providerPayload : undefined,
      location: normalizedRole === 'provider' ? providerLocation : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: toClientUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: toClientUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const signup = register;

export const updateProviderLocation = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can update GPS' });
    }

    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'lat and lng are required' });
    }

    req.user.location = {
      type: 'Point',
      coordinates: [Number(lng), Number(lat)],
    };
    await req.user.save();

    res.status(200).json({
      success: true,
      location: req.user.location,
    });
  } catch (error) {
    next(error);
  }
};

export const registerGarage = async (req, res, next) => {
  try {
    const { 
      garageName, 
      ownerName, 
      email, 
      phone, 
      password, 
      address, 
      city, 
      state, 
      zipCode, 
      services, 
      operatingHours,
      emergencyService,
      towingService 
    } = req.body;

    if (!garageName || !email || !password || !phone) {
      return res.status(400).json({ success: false, error: 'Garage name, email, password, and phone are required' });
    }

    if (!services || services.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one service is required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Garage with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const providerPayload = {
      businessName: garageName,
      ownerName: ownerName,
      address: address,
      city: city,
      state: state,
      zipCode: zipCode,
      services: services,
      operatingHours: operatingHours,
      emergencyService: emergencyService,
      towingService: towingService,
      providerType: 'garage',
      rating: 0, // Start with 0 rating
    };

    const garageUser = new User({
      name: ownerName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone,
      role: 'provider',
      providerInfo: providerPayload,
      location: {
        type: 'Point',
        coordinates: [0, 0] // Will be updated when provider sets location
      }
    });

    await garageUser.save();

    const token = generateToken(garageUser._id);

    res.status(201).json({
      success: true,
      message: 'Garage registered successfully',
      token,
      user: toClientUser(garageUser)
    });
  } catch (error) {
    next(error);
  }
};

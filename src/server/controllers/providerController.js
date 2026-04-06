import User from '../models/User.js';

// Haversine distance in km
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const searchProviders = async (req, res, next) => {
  try {
    const queryText = (req.query.query || '').trim();
    const city = (req.query.city || '').trim();
    const state = (req.query.state || '').trim();
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    // ── GPS-based nearby search ──────────────────────────────
    const userLat = req.query.lat ? Number(req.query.lat) : undefined;
    const userLng = req.query.lng ? Number(req.query.lng) : undefined;
    const hasLocation = Number.isFinite(userLat) && Number.isFinite(userLng);

    const filter = { role: 'provider' };
    if (city) {
      filter['providerInfo.city'] = new RegExp(`^${city}$`, 'i');
    }
    if (state) {
      filter['providerInfo.state'] = new RegExp(`^${state}$`, 'i');
    }
    if (queryText) {
      filter.$or = [
        { name: new RegExp(queryText, 'i') },
        { 'providerInfo.businessName': new RegExp(queryText, 'i') },
        { 'providerInfo.address': new RegExp(queryText, 'i') },
        { 'providerInfo.city': new RegExp(queryText, 'i') },
        { 'providerInfo.state': new RegExp(queryText, 'i') },
        { 'providerInfo.services': { $elemMatch: { $regex: queryText, $options: 'i' } } },
      ];
    }

    // Geo-spatial query when GPS coords are provided
    const MAX_DIST_METERS = 50_000; // 50 km radius
    if (hasLocation) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLng, userLat],
          },
          $maxDistance: MAX_DIST_METERS,
        },
      };
    }

    const providers = await User.find(filter)
      .select('name phone providerInfo location')
      .sort(hasLocation ? undefined : { 'providerInfo.rating': -1, createdAt: -1 })
      .limit(limit);

    const mapped = providers.map((provider) => {
      const info = provider.providerInfo || {};
      const cityName = info.city || '';
      const stateName = info.state || '';
      const address = info.address || [cityName, stateName].filter(Boolean).join(', ');

      // Calculate dynamic distance from GPS coords
      let distance = '—';
      let distanceNum = Infinity;
      if (hasLocation && provider.location?.coordinates?.length === 2) {
        const [pLng, pLat] = provider.location.coordinates;
        const distKm = haversineKm(userLat, userLng, pLat, pLng);
        distanceNum = distKm;
        distance = distKm < 1
          ? `${Math.round(distKm * 1000)} m`
          : `${distKm.toFixed(1)} km`;
      } else if (info.providerType === 'garage') {
        distance = 'Garage';
      }

      return {
        id: String(provider._id),
        name: info.businessName || provider.name,
        phone: provider.phone || '',
        services: Array.isArray(info.services) ? info.services : [],
        rating: info.rating ?? 0,
        address: address || 'Address not provided',
        city: cityName || 'Unknown',
        state: stateName || 'Unknown',
        providerType: info.providerType || 'provider',
        type: info.providerType === 'garage' ? 'garage' : 'local',
        distance,
        _distanceNum: distanceNum,
      };
    });

    // When GPS search: sort by distance ascending
    if (hasLocation) {
      mapped.sort((a, b) => a._distanceNum - b._distanceNum);
    }

    res.status(200).json({ success: true, providers: mapped });
  } catch (error) {
    next(error);
  }
};

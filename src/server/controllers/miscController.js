const otpStore = new Map();

export const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'phone is required' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    return res.status(200).json({
      success: true,
      otp,
      message: 'OTP generated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'lat and lng are required' });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RoadRescue/1.0',
      },
    });

    if (!response.ok) {
      return res.status(200).json({
        success: true,
        address: `${lat}, ${lng}`,
      });
    }

    const data = await response.json();
    return res.status(200).json({
      success: true,
      address: data.display_name || `${lat}, ${lng}`,
    });
  } catch {
    return res.status(200).json({
      success: true,
      address: `${req.body?.lat ?? ''}, ${req.body?.lng ?? ''}`.trim(),
    });
  }
};

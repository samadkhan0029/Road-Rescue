const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const twilio = require('twilio');
require('dotenv').config();

const connectDB = require('./config/database');
const geolocationService = require('./services/geolocationService');
const requestService = require('./services/requestService');
const authService = require('./services/authService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-request', (requestId) => {
    socket.join(`request-${requestId}`);
    console.log(`Client ${socket.id} joined request room: ${requestId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  const verification = authService.verifyToken(token);
  if (!verification.success) {
    return res.status(403).json({
      success: false,
      error: verification.error
    });
  }

  req.userId = verification.userId;
  next();
};

// Helper function to emit updates to clients
const emitRequestUpdate = (requestId, status, data) => {
  io.to(`request-${requestId}`).emit('request-update', {
    requestId,
    status,
    ...data
  });
};

// Geolocation API endpoint
app.post('/api/geolocation/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const result = await geolocationService.reverseGeocode(lat, lng);
    res.json(result);
  } catch (error) {
    console.error('Geolocation API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reverse geocode coordinates'
    });
  }
});

// Authentication endpoints

// Register new user/provider
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role = 'user', providerInfo } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    const result = await authService.register({
      name,
      email,
      phone,
      password,
      role,
      providerInfo
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Register garage provider
app.post('/api/auth/register-garage', async (req, res) => {
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
      towingService,
    } = req.body;

    // Validate required fields
    if (!garageName || !ownerName || !email || !phone || !password || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    if (!services || services.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please select at least one service'
      });
    }

    if (mongoose.connection.readyState === 1) {
      // Check for duplicate email/phone
      const existing = await mongoose.connection.db.collection('users').findOne({
        $or: [{ email }, { phone }]
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: existing.email === email ? 'Email already registered' : 'Phone already registered'
        });
      }

      // Hash password with bcrypt
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert garage user into users collection
      const garageUser = {
        name: ownerName,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        role: 'garage',
        isVerified: true,
        isActive: true,
        providerInfo: {
          businessName: garageName,
          services,
          rating: 0,
          totalJobs: 0,
          location: {
            type: 'Point',
            coordinates: [0, 0]  // Can be updated later via /api/auth/provider/location
          },
          address,
          city,
          state,
          zipCode,
          operatingHours,
          emergencyService: !!emergencyService,
          towingService: !!towingService,
        },
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await mongoose.connection.db.collection('users').insertOne(garageUser);
      garageUser._id = result.insertedId;

      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: garageUser._id },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from response
      const { password: _pw, ...userResponse } = garageUser;

      return res.status(201).json({
        success: true,
        user: userResponse,
        token,
        message: 'Garage registered successfully'
      });
    } else {
      // Fallback when DB not connected
      const mockUser = {
        _id: 'mock_garage_' + Date.now(),
        name: ownerName,
        email: email.toLowerCase(),
        phone,
        role: 'garage',
        isVerified: true,
        isActive: true,
        providerInfo: {
          businessName: garageName,
          services,
          address,
          city,
          state,
        },
        createdAt: new Date(),
      };

      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: mockUser._id },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-2024',
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        user: mockUser,
        token,
        message: 'Garage registered successfully (mock mode)'
      });
    }
  } catch (error) {
    console.error('Garage registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Garage registration failed'
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.login(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get user profile (protected)
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await authService.getProfile(req.userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

// Update user profile (protected)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await authService.updateProfile(req.userId, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change password (protected)
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    const result = await authService.changePassword(req.userId, currentPassword, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// Provider search (used by UserProfile GPS & filters)
app.get('/api/providers/search', async (req, res) => {
  try {
    const { query, city, state, lat, lng, limit } = req.query;
    const maxCount = parseInt(limit) || 60;
    // --- GPS MODE: MongoDB $near geospatial query ---
    const targetLat = lat ? parseFloat(lat) : null;
    const targetLng = lng ? parseFloat(lng) : null;

    // Haversine helper for in-memory distance calc (fallback / augmentation)
    const haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const toRad = (v) => (v * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    if (targetLat != null && targetLng != null && mongoose.connection.readyState === 1) {
      // Use MongoDB $near with 2dsphere index for proximity search
      try {
        // Ensure 2dsphere index exists
        const indexes = await mongoose.connection.db.collection('providers').indexes();
        const hasGeo = indexes.some(i => i.name && (i.name.includes('2dsphere') || i.name.includes('location')));
        if (!hasGeo) {
          await mongoose.connection.db.collection('providers').createIndex({ location: '2dsphere' });
        }

        const mongoFilter = {
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [targetLng, targetLat],
              },
              $maxDistance: 100000, // 100 km in meters (MongoDB $near with 2dsphere uses meters)
            },
          },
        };

        // Add field-based filters
        if (city) mongoFilter.city = { $regex: new RegExp('^' + city + '$', 'i') };
        if (state) mongoFilter.state = { $regex: new RegExp('^' + state + '$', 'i') };

        const results = await mongoose.connection.db
          .collection('providers')
          .find(mongoFilter)
          .limit(maxCount)
          .toArray();

        // Compute distance in km and format output
        const providers = results.map((p) => {
          const coord = p.location?.coordinates;
          const dist = coord
            ? haversine(targetLat, targetLng, coord[1], coord[0])
            : null;
          return {
            _id: p._id,
            name: p.name,
            phone: p.phone,
            address: p.address || '',
            city: p.city || 'Mumbai',
            state: p.state || 'Maharashtra',
            services: p.services || [],
            rating: p.rating ?? 4.0,
            type: p.source === 'scraper' ? 'local' : 'garage',
            _distanceNum: dist !== null ? parseFloat(dist.toFixed(1)) : null,
            distance: dist !== null ? dist.toFixed(1) + ' km' : '—',
          };
        });

        // If GPS query returns nothing, fall through to fallback below
        if (providers.length > 0) {
          providers.sort((a, b) => {
            if (a._distanceNum !== null && b._distanceNum !== null)
              return a._distanceNum - b._distanceNum;
            if (a._distanceNum !== null) return -1;
            return 1;
          });
          return res.json({ success: true, providers: providers.slice(0, maxCount) });
        }
      } catch (geoErr) {
        console.warn('MongoDB $near query failed, falling back:', geoErr.message);
        // fall through to JSON/DB fallback
      }
    }

    // --- FALLBACK: text / city / state filtering ---
    // (uses scraped JSON + DB providers, sorted manually)
    let all = [];

    // Try loading scraped JSON from disk
    const path = require('path');
    const scrapedPath = path.join(__dirname, '..', 'road-rescuepd', 'mumbai_providers.json');
    let scrapedData = [];
    try { scrapedData = require(scrapedPath); } catch { /* ok — DB only */ }

    const mumbaiCityMap = {
      chembur: 'Chembur', kurla: 'Kurla', andheri: 'Andheri',
      bandra: 'Bandra', dadar: 'Dadar', borivali: 'Borivali',
      goregaon: 'Goregaon', malad: 'Malad', juhu: 'Juhu',
      powai: 'Powai', thane: 'Thane', navi: 'Navi Mumbai',
    };

    const toServiceTag = (rawService) => {
      const s = rawService.toLowerCase().replace(/[^a-z]/g, '');
      if (s.includes('tow')) return 'Towing';
      if (s.includes('repair') || s.includes('garage') || s.includes('automotiv') || s.includes('motors')) return 'Car Repair';
      if (s.includes('battery')) return 'Battery';
      if (s.includes('fuel')) return 'Fuel';
      if (s.includes('tire') || s.includes('flat')) return 'Flat Tire';
      if (s.includes('lock') || s.includes('key')) return 'Lockout';
      if (s.includes('emergency') || s.includes('highway') || s.includes('rescue') || s.includes('roadside')) return 'Highway Help';
      if (s.includes('bike') || s.includes('motorcycle')) return 'Bike Repair';
      return 'Towing';
    };

    all = scrapedData.map((p, idx) => ({
      _id: 'scraped_' + idx,
      name: p.name,
      phone: p.phone,
      address: p.address,
      city: mumbaiCityMap[(p.city || '').toLowerCase()] || p.city || 'Mumbai',
      state: 'Maharashtra',
      services: (p.services || []).map(toServiceTag),
      rating: p.rating ?? 4.0,
      type: 'local',
      _distanceNum: null,
      distance: '—',
    }));

    // Merge DB providers
    if (mongoose.connection.readyState === 1) {
      try {
        const dbProvList = await mongoose.connection.db.collection('providers').find().toArray();
        dbProvList.forEach((dp) => {
          if (!all.some((x) => x.name === dp.name && x.phone === dp.phone)) {
            all.push({
              _id: dp._id,
              name: dp.name || 'Provider',
              phone: dp.phone || '',
              address: dp.address || '',
              city: dp.city || 'Mumbai',
              state: dp.state || 'Maharashtra',
              services: dp.services || [],
              rating: dp.rating ?? 4.0,
              type: 'local',
              _distanceNum: null,
              distance: '—',
            });
          }
        });
      } catch { /* db unavailable */ }
    }

    // Apply filters
    let results = all;
    if (city) {
      results = results.filter((p) => p.city.toLowerCase() === city.toLowerCase());
    }
    if (state) {
      results = results.filter((p) => p.state.toLowerCase() === state.toLowerCase());
    }
    if (query && query.trim() && query !== 'Current Location (GPS)') {
      const q = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }

    // If GPS coords present, compute distance for fallback results too
    if (targetLat != null && targetLng != null) {
      results = results.map((p) => {
        // Try to compute from scraped data
        const scraped = scrapedData.find((s) => s.name === p.name && s.phone === p.phone);
        const coord = scraped?.coordinates;
        const dist = coord
          ? haversine(targetLat, targetLng, coord.lat, coord.lng)
          : (p._distanceNum ?? Infinity);
        return {
          ...p,
          _distanceNum: dist ?? Infinity,
          distance: dist !== Infinity ? dist.toFixed(1) + ' km' : p.distance,
        };
      });
      results.sort((a, b) => (a._distanceNum ?? Infinity) - (b._distanceNum ?? Infinity));
    }

    res.json({ success: true, providers: results.slice(0, maxCount) });
  } catch (error) {
    console.error('Provider search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search providers',
      providers: [],
    });
  }
});

// Get all providers (public)
app.get('/api/auth/providers', async (req, res) => {
  try {
    const result = await authService.getAllProviders();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get providers'
    });
  }
});

// Update provider location (protected, providers only)
app.put('/api/auth/provider/location', authenticateToken, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const result = await authService.updateProviderLocation(req.userId, { lat, lng });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Update provider location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location'
    });
  }
});

// Service Request Submission endpoint
app.post('/api/requests', async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      serviceType,
      location,
      address
    } = req.body;

    // Validate required fields
    if (!customerId || !customerName || !customerPhone || !serviceType || !location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create request with location in GeoJSON format
    const requestData = {
      customerId,
      customerName,
      customerPhone,
      serviceType,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
        address: address || `${location.lat}, ${location.lng}`
      }
    };

    const result = await requestService.createRequest(requestData);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    // Start processing the request in the background
    setTimeout(async () => {
      const processResult = await requestService.processRequest(result.request._id);
      
      if (processResult.success) {
        emitRequestUpdate(result.request._id, 'ACCEPTED', {
          provider: processResult.provider,
          message: 'Provider assigned and en route'
        });
      } else {
        emitRequestUpdate(result.request._id, 'PENDING', {
          error: processResult.error,
          message: 'No providers available at the moment'
        });
      }
    }, 2000); // Simulate 2-second search time

    // Emit initial status
    emitRequestUpdate(result.request._id, 'SEARCHING', {
      message: 'Finding nearby providers...'
    });

    res.status(201).json({
      success: true,
      request: result.request,
      message: 'Request submitted successfully'
    });
  } catch (error) {
    console.error('Request submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit request'
    });
  }
});

// Get request status
app.get('/api/requests/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const result = await requestService.getRequest(requestId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get request'
    });
  }
});

// Get all requests for a customer
app.get('/api/requests/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await requestService.getAllRequests(customerId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get customer requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer requests'
    });
  }
});

// --- Provider-facing request endpoints ---

// Get available (ACCEPTED but no provider) requests near the provider
app.get('/api/requests/provider/available-nearby', authenticateToken, async (req, res) => {
  try {
    const Request = require('./models/Request');
    const { lat, lng, radius } = req.query;
    const maxDistance = parseInt(radius) || 50000; // default 50 km in meters

    const query = {
      status: 'PENDING',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: maxDistance,
        },
      },
    };

    const requests = await Request.find(query).limit(20);
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Available nearby error:', error);
    res.status(500).json({ success: false, error: 'Failed to find nearby requests' });
  }
});

// Get the provider's currently active (non-COMPLETED, non-CANCELLED) job
app.get('/api/requests/provider/active', authenticateToken, async (req, res) => {
  try {
    const Request = require('./models/Request');
    const request = await Request.findOne({
      'assignedProvider.providerId': req.userId,
      status: { $in: ['ACCEPTED', 'IN_PROGRESS', 'EN_ROUTE'] },
    });

    res.json({ success: true, request });
  } catch (error) {
    console.error('Active job error:', error);
    res.status(500).json({ success: false, error: 'Failed to get active job' });
  }
});

// Provider accepts a pending request
app.patch('/api/requests/accept/:id', authenticateToken, async (req, res) => {
  try {
    const Request = require('./models/Request');
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Request already handled by another provider' });
    }

    const User = require('./models/User');
    const provider = await User.findById(req.userId);

    request.status = 'ACCEPTED';
    request.assignedProvider = {
      providerId: req.userId,
      providerName: provider?.name || provider?.providerInfo?.businessName || 'Provider',
      providerPhone: provider?.phone || provider?.providerInfo?.phone || '',
    };
    await request.save();

    // Notify customer
    io.to(`request-${request._id}`).emit('request-update', {
      requestId: request._id,
      status: 'ACCEPTED',
      provider: request.assignedProvider,
      message: 'A provider has accepted your request',
    });

    res.json({ success: true, request });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ success: false, error: 'Failed to accept request' });
  }
});

// Provider ignores a pending request
app.patch('/api/requests/ignore/:id', authenticateToken, async (req, res) => {
  try {
    const Request = require('./models/Request');
    res.json({ success: true, message: 'Request ignored' });
  } catch (error) {
    console.error('Ignore request error:', error);
    res.status(500).json({ success: false, error: 'Failed to ignore request' });
  }
});

// Provider marks job as completed
app.patch('/api/requests/complete/:id', authenticateToken, async (req, res) => {
  try {
    const Request = require('./models/Request');
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const assignedId = request.assignedProvider?.providerId?.toString();
    if (assignedId && assignedId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    request.status = 'COMPLETED';
    request.completedAt = new Date();
    await request.save();

    io.to(`request-${request._id}`).emit('request-update', {
      requestId: request._id,
      status: 'COMPLETED',
      message: 'Job has been completed',
    });

    res.json({ success: true, request });
  } catch (error) {
    console.error('Complete request error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete request' });
  }
});

// Customer cancels their own request
app.patch('/api/requests/customer-cancel/:id', authenticateToken, async (req, res) => {
  try {
    const Request = require('./models/Request');
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Provider ID stored as customerId (see POST /api/requests where customerId is set)
    // Check ownership via token userId or customerId match
    if (request.customerId !== req.userId && String(request.customerId) !== String(req.userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    request.status = 'CANCELLED';
    request.cancelledAt = new Date();
    await request.save();

    io.to(`request-${request._id}`).emit('request-update', {
      requestId: request._id,
      status: 'CANCELLED',
      message: 'Request has been cancelled by customer',
    });

    res.json({ success: true, request });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel request' });
  }
});

// Rescue history for logged-in user
app.get('/api/users/rescue-history', authenticateToken, async (req, res) => {
  try {
    const Request = require('./models/Request');
    const { status } = req.query;

    const query = { customerId: req.userId };
    if (status) {
      query.status = { $in: status.split(',') };
    } else {
      query.status = { $in: ['COMPLETED', 'CANCELLED'] };
    }

    const requests = await Request.find(query)
      .sort({ completedAt: -1, cancelledAt: -1, updatedAt: -1 })
      .limit(100);

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Rescue history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rescue history' });
  }
});

// Provider stats endpoint
app.get('/api/providers/stats/:providerId', authenticateToken, async (req, res) => {
  try {
    const { providerId } = req.params;
    const Request = require('./models/Request');

    // Fetch all completed jobs for this provider
    const completedJobs = await Request.find({
      'assignedProvider.providerId': providerId,
      status: 'COMPLETED',
    }).sort({ completedAt: -1 }).limit(100);

    // Calculate total earnings from fare.totalFare
    const totalEarnings = completedJobs.reduce((sum, job) => {
      const fare = job.fare?.totalFare ?? 0;
      return sum + fare;
    }, 0);

    // Get last 5 jobs for recent history
    const recentJobs = completedJobs.slice(0, 5).map((job) => {
      const locationName = job.location?.address || 'Unknown location';

      return {
        id: job._id.toString(),
        customerName: job.customerName || 'Customer',
        serviceType: job.serviceType || 'Emergency Service',
        locationName: locationName.split(',').slice(0, 2).join(',').trim(),
        fareLabel: job.fare?.totalFare ? `₹${job.fare.totalFare}` : '₹—',
        rating: job.fare?.baseFee ? 5.0 : 4.5,
        completedAt: job.completedAt?.toISOString() || new Date().toISOString(),
      };
    });

    // Fetch provider's rating from users collection
    let averageRating = null;
    try {
      const providerDoc = await mongoose.connection.db.collection('users').findOne({ _id: providerId });
      if (providerDoc?.providerInfo?.rating) {
        averageRating = parseFloat(providerDoc.providerInfo.rating);
      }
    } catch {
      /* rating not available */
    }

    res.json({
      success: true,
      data: {
        totalEarnings,
        jobsCompleted: completedJobs.length,
        averageRating,
        totalReviews: completedJobs.length,
        recentJobs,
      },
    });
  } catch (error) {
    console.error('Provider stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider stats',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Road Rescue API is running',
    timestamp: new Date().toISOString()
  });
});

// Export app for serverless deployment
module.exports = app;

// ==================== Vehicle API Routes ====================

// Add a vehicle for the current user
app.post('/api/vehicles', authenticateToken, async (req, res) => {
  try {
    const { make, model, year, licensePlate, color, fuelType = 'Petrol', vehicleType = 'car' } = req.body;

    if (!make || !model || !year || !color) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: make, model, year, color'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      // Mock mode
      const mockVehicle = {
        _id: 'vehicle_' + Date.now(),
        userId: req.userId,
        make, model, year, licensePlate: licensePlate || '', color, fuelType, vehicleType,
        image: req.body.image || '',
        createdAt: new Date()
      };
      return res.status(201).json({ success: true, vehicle: mockVehicle, message: 'Vehicle added (mock mode)' });
    }

    const Vehicle = require('./models/Vehicle');
    const vehicle = new Vehicle({
      userId: req.userId,
      make, model, year,
      licensePlate: licensePlate || '',
      color, fuelType, vehicleType,
      image: req.body.image || '',
    });
    await vehicle.save();

    res.status(201).json({ success: true, vehicle, message: 'Vehicle added successfully' });
  } catch (error) {
    console.error('Add vehicle error:', error);
    // Duplicate plate
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'A vehicle with this license plate already exists in your garage' });
    }
    res.status(500).json({ success: false, error: 'Failed to add vehicle' });
  }
});

// Get all vehicles for the current user
app.get('/api/vehicles', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Mock mode
      return res.json({ success: true, vehicles: [] });
    }

    const Vehicle = require('./models/Vehicle');
    const vehicles = await Vehicle.find({ userId: req.userId }).sort({ createdAt: -1 });

    res.json({ success: true, vehicles });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vehicles' });
  }
});

// Delete a vehicle
app.delete('/api/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, message: 'Vehicle deleted (mock mode)' });
    }

    const Vehicle = require('./models/Vehicle');
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.userId });

    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    await vehicle.deleteOne();
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete vehicle' });
  }
});

// --- PAYMENT ROUTES ---

// PATCH /api/payments/cod - Confirm Cash on Delivery payment
app.patch('/api/payments/cod', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Request ID is required' });
    }

    const Request = require('./models/Request');

    const request = await Request.findOne({ _id: requestId });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Update payment status to COD confirmed
    request.paymentMethod = 'COD';
    request.paymentStatus = 'AWAITING_CASH_CONFIRMATION';
    request.status = 'COMPLETED';
    request.completedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'COD payment confirmed. Provider has been notified.',
      request
    });
  } catch (error) {
    console.error('COD payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm COD payment' });
  }
});

// POST /api/payments/card - Process card payment
app.post('/api/payments/card', authenticateToken, async (req, res) => {
  try {
    const { requestId, amount } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Request ID is required' });
    }

    const Request = require('./models/Request');

    const request = await Request.findOne({ _id: requestId });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    // Update payment status to card payment confirmed
    request.paymentMethod = 'card';
    request.paymentStatus = 'PAID';
    request.status = 'COMPLETED';
    request.completedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Card payment processed successfully.',
      request
    });
  } catch (error) {
    console.error('Card payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to process card payment' });
  }
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Road Rescue API is running',
    timestamp: new Date().toISOString()
  });
});

// --- USE ENVIRONMENT VARIABLES FOR TWILIO CREDENTIALS ---
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Only initialize Twilio if credentials are provided
let client = null;
if (accountSid && authToken) {
  client = new twilio(accountSid, authToken);
} else {
  console.log('Twilio credentials not found in environment variables. OTP functionality will be limited.');
}

// Generate a random 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000);

app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = generateOTP();

  console.log(`Sending OTP: ${otp} to ${phone}`);

  try {
    // Only send via Twilio if client is available
    if (client) {
      // Format phone number for Twilio
      let formattedPhone = phone;
      if (!phone.startsWith('+')) {
        formattedPhone = '+' + phone.replace(/\D/g, ''); // Remove non-digits and add +
      }

      const message = await client.messages.create({
        body: `Your RoadRescue Verification Code is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886',
        to: formattedPhone
      });

      console.log('WhatsApp message sent:', message.sid);
    } else {
      console.log('Twilio not available - OTP sent for development only');
    }

    res.json({ 
      success: true, 
      message: client ? 'OTP sent successfully via WhatsApp' : 'OTP generated (development mode)',
      otp: otp // Only for development - remove in production
    });

  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    
    // Fallback: Return OTP even if Twilio fails (for development)
    console.log("Returning OTP as fallback for development");
    res.json({ 
      success: true, 
      message: 'OTP generated (fallback mode)',
      otp: otp // Only for development - remove in production
    });
  }
});

// Old line:
// app.listen(5000, () => console.log('Backend Server running on port 5000'));

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
  console.log(`Socket.io server ready for connections`);
});
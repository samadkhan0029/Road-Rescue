# Road Rescue Backend API

## Overview

Complete backend implementation for the Road Rescue Emergency Request flow with real-time updates, geolocation services, and provider matching logic.

## Features Implemented

✅ **Geolocation API** - Reverse geocoding using OpenStreetMap Nominatim
✅ **Service Request Submission** - POST /api/requests endpoint
✅ **Provider Matching Logic** - 10km radius filtering with Haversine distance calculation
✅ **Real-time Updates** - Socket.io for live status updates
✅ **Database Schema** - MongoDB models with GeoJSON support
✅ **CORS Configuration** - Proper cross-origin setup
✅ **Error Handling** - Graceful fallback to mock data when DB unavailable

## API Endpoints

### Health Check
```
GET /api/health
```

### Geolocation
```
POST /api/geolocation/reverse
Body: { lat: number, lng: number }
Response: { success: boolean, address: string, components: object }
```

### Service Requests
```
POST /api/requests
Body: {
  customerId: string,
  customerName: string,
  customerPhone: string,
  serviceType: "Towing" | "Battery Jump" | "Flat Tire" | "Fuel Delivery",
  location: { lat: number, lng: number },
  address: string
}
```

```
GET /api/requests/:requestId
GET /api/requests/customer/:customerId
```

### Real-time Events (Socket.io)
- `join-request` - Join a request room for updates
- `request-update` - Receive status updates (SEARCHING, ACCEPTED, PENDING)

## Database Schema

### Request Model
```javascript
{
  customerId: String,
  customerName: String,
  customerPhone: String,
  serviceType: String,
  location: {
    type: 'Point',
    coordinates: [lng, lat],
    address: String
  },
  status: 'PENDING' | 'SEARCHING' | 'ACCEPTED' | 'COMPLETED',
  assignedProvider: {
    providerId: String,
    providerName: String,
    providerPhone: String,
    estimatedArrival: Date,
    distance: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Provider Model
```javascript
{
  name: String,
  phone: String,
  email: String,
  services: [String],
  location: {
    type: 'Point',
    coordinates: [lng, lat]
  },
  isActive: Boolean,
  rating: Number,
  vehicleNumber: String
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Variables
Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/road-rescue
PORT=5001
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### 3. Start MongoDB (Optional)
```bash
# If using MongoDB locally
mongod
```

### 4. Start Server
```bash
node Server.js
```

The server will run on `http://localhost:5001` and gracefully handle MongoDB connection failures by using mock data.

## Testing

Run the test script:
```bash
node test-api.js
```

This will test:
- Health check endpoint
- Geolocation reverse lookup
- Request submission
- Socket.io real-time updates

## Frontend Integration

The frontend (React app) connects to:
- Backend API: `http://localhost:5001`
- Socket.io: `http://localhost:5001`

The Emergency.jsx component has been updated to use:
- Backend geolocation API with fallback
- Socket.io for real-time status updates
- Proper error handling and retry logic

## Provider Matching Algorithm

1. **Database Query**: Uses MongoDB geospatial `$near` query for optimal performance
2. **Distance Calculation**: Haversine formula for accurate distance measurement
3. **Mock Fallback**: Creates mock providers when database is unavailable
4. **10km Radius**: Filters providers within 10km of request location
5. **ETA Calculation**: Estimates arrival time (3 minutes per km)

## Error Handling

- **Database Errors**: Graceful fallback to mock data
- **Geolocation Errors**: Fallback to coordinate display
- **Socket.io Errors**: Connection status indicators
- **API Errors**: Proper HTTP status codes and error messages

## Production Considerations

- Replace mock provider data with real provider database
- Add authentication/authorization middleware
- Implement rate limiting for API endpoints
- Add logging and monitoring
- Set up proper MongoDB connection pooling
- Configure SSL/HTTPS
- Add input validation and sanitization

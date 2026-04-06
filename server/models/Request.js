const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['Towing', 'Battery Jump', 'Flat Tire', 'Fuel Delivery']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'SEARCHING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  fare: {
    baseFee: Number,
    distanceCharge: Number,
    totalFare: Number,
    distanceKm: Number,
    ratePerKm: Number,
  },
  assignedProvider: {
    providerId: String,
    providerName: String,
    providerPhone: String,
    estimatedArrival: Date,
    distance: Number
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'card', 'upi', 'wallet'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'AWAITING_CASH_CONFIRMATION', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location-based queries
requestSchema.index({ location: '2dsphere' });

// Update the updatedAt field on save
requestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Request', requestSchema);

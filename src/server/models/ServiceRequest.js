import mongoose from 'mongoose';

const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
);

const serviceRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /** Provider currently receiving the offer popup (sequential dispatch). */
    currentOfferProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      // pending: request created, not yet accepted by any provider
      // searching: legacy name used by older clients (treated like pending)
      enum: ['pending', 'searching', 'accepted', 'ignored', 'completed', 'cancelled'],
      default: 'pending',
      required: true,
    },
    ignoredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    locationName: {
      type: String,
      required: true,
      trim: true,
    },
    coords: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    serviceType: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: geoPointSchema,
      required: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    // Fare calculation fields
    distance: {
      type: Number,
      default: 0,
    },
    baseFee: {
      type: Number,
      default: 500,
    },
    distanceCharge: {
      type: Number,
      default: 0,
    },
    totalFare: {
      type: Number,
      default: 600,
    },
    ratePerKm: {
      type: Number,
      default: 50,
    },
    minFare: {
      type: Number,
      default: 600,
    },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ location: '2dsphere' });
serviceRequestSchema.index({ status: 1, currentOfferProvider: 1 });
serviceRequestSchema.index({ status: 1, provider: 1, createdAt: -1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

export default ServiceRequest;

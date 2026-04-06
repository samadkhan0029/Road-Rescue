import mongoose from 'mongoose';

const providerInfoSchema = new mongoose.Schema(
  {
    businessName: { type: String, trim: true },
    providerType: {
      type: String,
      enum: ['provider', 'garage'],
      default: 'provider',
    },
    services: [{ type: String, trim: true }],
    experience: { type: Number, default: 0 },
    companyDetails: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    rating: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    lastReviewAt: { type: Date, default: null },
  },
  { _id: false }
);

const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: undefined,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['customer', 'provider'],
      required: true,
      default: 'customer',
    },
    providerInfo: {
      type: providerInfoSchema,
      default: undefined,
    },
    location: {
      type: geoPointSchema,
      default: undefined,
    },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

export default User;

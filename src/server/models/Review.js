import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
    unique: true // One review per job
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Changed from 'Provider' to 'User' since providers are stored in User model
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  tags: [{
    type: String,
    enum: ['Fast Arrival', 'Professional', 'Fair Price', 'Friendly', 'Well-equipped', 'Safe Driving']
  }],
  comment: {
    type: String,
    maxlength: 500,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
reviewSchema.index({ providerId: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1 });

export default mongoose.model('Review', reviewSchema);

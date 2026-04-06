const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: true
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  color: {
    type: String,
    required: true
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'],
    default: 'Petrol'
  },
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'truck'],
    default: 'car'
  },
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Vehicle', vehicleSchema, 'vehicles');

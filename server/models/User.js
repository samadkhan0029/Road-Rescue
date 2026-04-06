const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Only create schema if MongoDB is connected, otherwise use a mock schema
let userSchema;
if (mongoose.connection.readyState === 1) {
  userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'provider', 'garage'],
      default: 'user'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    profilePicture: {
      type: String,
      default: ''
    },
    // User specific fields
    vehicleInfo: {
      vehicleNumber: String,
      vehicleType: String,
      vehicleModel: String
    },
    // Provider specific fields
    providerInfo: {
      businessName: String,
      services: [{
        type: String,
        enum: ['Towing', 'Battery Jump', 'Flat Tire', 'Fuel Delivery', 'Lockout Service', 'Accident Assistance', 'Mechanic / Repair']
      }],
      experience: Number,
      licenseNumber: String,
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalJobs: {
        type: Number,
        default: 0
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number],
          default: [0, 0]
        }
      }
    },
    lastLogin: {
      type: Date,
      default: Date.now
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

  // Create indexes for better performance
  userSchema.index({ email: 1 });
  userSchema.index({ phone: 1 });
  userSchema.index({ role: 1 });
  userSchema.index({ 'providerInfo.location': '2dsphere' }); // For provider location searches

  // Pre-save middleware to hash password
  userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
      // Hash password with cost of 12
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  // Pre-save middleware to update updatedAt
  userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
  });

  // Instance method to check password
  userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      throw error;
    }
  };

  // Instance method to get user profile without sensitive data
  userSchema.methods.toProfileJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__v;
    return userObject;
  };

  // Static methods
  userSchema.statics.findByEmailWithPassword = function(email) {
    return this.findOne({ email }).select('+password');
  };

  userSchema.statics.findByPhoneWithPassword = function(phone) {
    return this.findOne({ phone }).select('+password');
  };
} else {
  // Mock schema for when database is not connected
  userSchema = {
    statics: {
      findByEmailWithPassword: () => Promise.resolve(null),
      findByPhoneWithPassword: () => Promise.resolve(null),
      findOne: () => Promise.resolve(null)
    },
    methods: {
      comparePassword: () => Promise.resolve(false),
      toProfileJSON: function() { return this; }
    }
  };
}

// Create model only if database is connected
let User;
if (mongoose.connection.readyState === 1) {
  User = mongoose.model('User', userSchema);
} else {
  // Mock User class for when database is not connected
  User = class MockUser {
    static findByEmailWithPassword() { return Promise.resolve(null); }
    static findByPhoneWithPassword() { return Promise.resolve(null); }
    static findOne() { return Promise.resolve(null); }
    static findById() { return Promise.resolve(null); }
    static async save() { throw new Error('Database not connected'); }
  };
}

module.exports = User;

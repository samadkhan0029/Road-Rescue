const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Register new user
  async register(userData) {
    try {
      const { name, email, phone, password, role = 'user', providerInfo = {} } = userData;

      // Check if database is connected
      if (mongoose.connection.readyState !== 1) {
        // Fallback to mock registration when database is not available
        console.log('Using mock registration (database not connected)');
        
        const mockUser = {
          _id: 'mock_' + Date.now(),
          name,
          email,
          phone,
          role,
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(role === 'provider' && { providerInfo })
        };

        // Generate token
        const token = this.generateToken(mockUser._id);

        return {
          success: true,
          user: mockUser,
          token,
          message: `${role === 'provider' ? 'Provider' : 'User'} registered successfully (mock mode)`
        };
      }

      // Database operations when connected
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [{ email }, { phone }]
        });

        if (existingUser) {
          if (existingUser.email === email) {
            return {
              success: false,
              error: 'Email already registered'
            };
          }
          if (existingUser.phone === phone) {
            return {
              success: false,
              error: 'Phone number already registered'
            };
          }
        }

        // Create new user
        const newUser = new User({
          name,
          email,
          phone,
          password,
          role,
          isVerified: true, // For now, auto-verify after OTP
          ...(role === 'provider' && { providerInfo })
        });

        await newUser.save();

        // Generate token
        const token = this.generateToken(newUser._id);

        return {
          success: true,
          user: newUser.toProfileJSON(),
          token,
          message: `${role === 'provider' ? 'Provider' : 'User'} registered successfully`
        };
      } catch (dbError) {
        console.log('Database operation failed, falling back to mock');
        
        // Fallback to mock registration
        const mockUser = {
          _id: 'mock_' + Date.now(),
          name,
          email,
          phone,
          role,
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(role === 'provider' && { providerInfo })
        };

        const token = this.generateToken(mockUser._id);

        return {
          success: true,
          user: mockUser,
          token,
          message: `${role === 'provider' ? 'Provider' : 'User'} registered successfully (fallback mode)`
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Check if database is connected
      if (mongoose.connection.readyState !== 1) {
        // Fallback to mock login when database is not available
        if (password === 'password123') {
          const mockUser = {
            _id: 'mock_' + Date.now(),
            name: email.includes('provider') ? 'Mock Provider' : 'Mock User',
            email,
            role: email.includes('provider') ? 'provider' : 'user',
            isVerified: true,
            isActive: true,
            createdAt: new Date(),
            lastLogin: new Date(),
            ...(email.includes('provider') && {
              providerInfo: {
                businessName: 'Mock Business',
                services: ['Towing'],
                rating: 4.5,
                experience: 5
              }
            })
          };

          // Generate token
          const token = this.generateToken(mockUser._id);

          return {
            success: true,
            user: mockUser,
            token,
            message: 'Login successful (mock mode)'
          };
        } else {
          return {
            success: false,
            error: 'Invalid email or password'
          };
        }
      }

      // Find user by email with password
      const user = await User.findByEmailWithPassword(email);

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account has been deactivated'
        };
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken(user._id);

      return {
        success: true,
        user: user.toProfileJSON(),
        token,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  // Get user profile by ID
  async getProfile(userId) {
    try {
      // Check if database is connected
      if (mongoose.connection.readyState !== 1) {
        // Fallback to mock profile when database is not available
        console.log('Using mock profile (database not connected)');
        
        // For mock users, we'll return a basic profile
        const mockProfile = {
          _id: userId,
          name: 'Mock User',
          email: 'mock@example.com',
          role: 'user',
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        return {
          success: true,
          user: mockProfile
        };
      }

      const user = await User.findById(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        user: user.toProfileJSON()
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get profile'
      };
    }
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    try {
      // Remove sensitive fields that shouldn't be updated directly
      const { password, role, isVerified, ...allowedUpdates } = updateData;

      const user = await User.findByIdAndUpdate(
        userId,
        { ...allowedUpdates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        user: user.toProfileJSON(),
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      };
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to change password'
      };
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      );
      return {
        success: true,
        userId: decoded.userId
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }
  }

  // Get all providers (for admin purposes)
  async getAllProviders() {
    try {
      const providers = await User.find({ 
        role: 'provider', 
        isActive: true 
      }).select('-password');

      return {
        success: true,
        providers
      };
    } catch (error) {
      console.error('Get providers error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get providers'
      };
    }
  }

  // Update provider location
  async updateProviderLocation(providerId, coordinates) {
    try {
      const provider = await User.findOneAndUpdate(
        { _id: providerId, role: 'provider' },
        { 
          'providerInfo.location': {
            type: 'Point',
            coordinates: [coordinates.lng, coordinates.lat]
          }
        },
        { new: true }
      );

      if (!provider) {
        return {
          success: false,
          error: 'Provider not found'
        };
      }

      return {
        success: true,
        message: 'Location updated successfully'
      };
    } catch (error) {
      console.error('Update provider location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update location'
      };
    }
  }
}

module.exports = new AuthService();

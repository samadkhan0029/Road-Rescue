const mongoose = require('mongoose');
const User = require('../models/User');

class ProviderService {
  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Find nearby providers within a specified radius (default 10km)
  async findNearbyProviders(lat, lng, serviceType, radiusKm = 10) {
    try {
      // First, try using MongoDB geospatial query with User model
      const providers = await User.find({
        role: 'provider',
        isActive: true,
        'providerInfo.services': serviceType,
        'providerInfo.location': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radiusKm * 1000 // Convert to meters
          }
        }
      }).limit(10);

      // If no providers found with geospatial query, return empty result
      if (providers.length === 0) {
        return {
          success: true,
          providers: []
        };
      }

      // Calculate actual distances for each provider
      const providersWithDistance = providers.map(provider => {
        const providerLat = provider.providerInfo.location.coordinates[1];
        const providerLng = provider.providerInfo.location.coordinates[0];
        const distance = this.calculateDistance(lat, lng, providerLat, providerLng);
        
        return {
          ...provider.toObject(),
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        };
      });

      return {
        success: true,
        providers: providersWithDistance.sort((a, b) => a.distance - b.distance)
      };
    } catch (error) {
      console.error('Error finding nearby providers:', error);
      return {
        success: false,
        providers: [],
        error: 'Provider lookup failed'
      };
    }
  }

  // Legacy method retained for compatibility; returns no mock data.
  createMockProviders(lat, lng, serviceType, radiusKm) {
    return {
      success: true,
      providers: []
    };
  }

  // Assign the nearest available provider to a request
  async assignProvider(requestId, lat, lng, serviceType) {
    try {
      const result = await this.findNearbyProviders(lat, lng, serviceType);
      
      if (!result.success || result.providers.length === 0) {
        return {
          success: false,
          error: 'No providers available in your area'
        };
      }

      const assignedProvider = result.providers[0];
      
      // Calculate estimated arrival time (rough estimate: 3 minutes per km)
      const estimatedArrival = new Date();
      estimatedArrival.setMinutes(
        estimatedArrival.getMinutes() + Math.ceil(assignedProvider.distance * 3)
      );

      return {
        success: true,
        provider: {
          providerId: assignedProvider._id,
          providerName: assignedProvider.name,
          providerPhone: assignedProvider.phone,
          providerEmail: assignedProvider.email,
          estimatedArrival,
          distance: assignedProvider.distance,
          rating: assignedProvider.providerInfo?.rating || 4.5,
          vehicleNumber: assignedProvider.providerInfo?.vehicleNumber || 'N/A',
          businessName: assignedProvider.providerInfo?.businessName || assignedProvider.name,
          experience: assignedProvider.providerInfo?.experience || 0
        }
      };
    } catch (error) {
      console.error('Error assigning provider:', error);
      return {
        success: false,
        error: 'Failed to assign provider'
      };
    }
  }
}

module.exports = new ProviderService();

import User from '../models/User.js';
import axios from 'axios';

// Service-specific pricing configuration
const SERVICE_PRICING = {
  'Battery Jump Start': {
    baseFee: 400,
    ratePerKm: 30,
    minFare: 500,
    color: 'purple',
    icon: 'zap'
  },
  'Fuel Delivery': {
    baseFee: 300,
    ratePerKm: 30,
    minFare: 400,
    color: 'orange',
    icon: 'fuel-pump'
  },
  'Flat Tire Change': {
    baseFee: 450,
    ratePerKm: 30,
    minFare: 550,
    color: 'blue',
    icon: 'wrench'
  },
  'Towing Service': {
    baseFee: 700,
    ratePerKm: 60,
    minFare: 1000,
    color: 'red',
    icon: 'truck'
  },
  'Lockout Service': {
    baseFee: 500,
    ratePerKm: 30,
    minFare: 600,
    color: 'yellow',
    icon: 'key'
  },
  'Accident Assistance': {
    baseFee: 1000,
    ratePerKm: 60,
    minFare: 1500,
    color: 'red',
    icon: 'alert-triangle'
  }
};

// Geoapify API configuration
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || '2147625628e7408baf97ef929225f25a';
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/routing';

/**
 * Get pricing configuration for a specific service type
 * @param {string} serviceType - The service type
 * @returns {Object} - Pricing configuration for the service
 */
export const getServicePricing = (serviceType) => {
  // Handle different possible service type formats
  const normalizedServiceType = serviceType?.toLowerCase().trim();
  
  // Find matching pricing configuration
  for (const [serviceName, pricing] of Object.entries(SERVICE_PRICING)) {
    if (serviceName.toLowerCase().includes(normalizedServiceType) || 
        normalizedServiceType.includes(serviceName.toLowerCase())) {
      return pricing;
    }
  }
  
  // Default pricing if no match found
  return {
    baseFee: 500,
    ratePerKm: 50,
    minFare: 600,
    color: 'blue',
    icon: 'help-circle'
  };
};

/**
 * Calculate distance between two coordinates using Geoapify API
 * @param {Object} startCoords - Starting coordinates {lat, lng}
 * @param {Object} endCoords - Ending coordinates {lat, lng}
 * @returns {Promise<number>} - Distance in kilometers
 */
export const calculateDistance = async (startCoords, endCoords) => {
  try {
    // Validate input coordinates
    if (!startCoords || !endCoords || 
        !startCoords.lat || !startCoords.lng || 
        !endCoords.lat || !endCoords.lng) {
      throw new Error('Invalid coordinates provided');
    }

    // Make API request to Geoapify Routing API
    const apiUrl = `${GEOAPIFY_BASE_URL}?waypoints=${startCoords.lat},${startCoords.lng}|${endCoords.lat},${endCoords.lng}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
    
    console.log('Calling Geoapify API for distance calculation:', apiUrl);
    
    const response = await axios.get(apiUrl);
    
    if (!response.data || !response.data.features || response.data.features.length === 0) {
      throw new Error('No route found between the specified points');
    }

    // Extract distance from API response
    const route = response.data.features[0];
    const distanceInMeters = route.properties.distance;
    
    if (!distanceInMeters || distanceInMeters <= 0) {
      throw new Error('Invalid distance data received from API');
    }

    // Convert meters to kilometers
    const distanceKm = distanceInMeters / 1000;
    return distanceKm;
    
  } catch (error) {
    console.error('Error calculating distance:', error.message);
    // Return default distance for API failures
    return 5; // Default 5 km
  }
};

/**
 * Calculate job fare based on distance and service type
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} serviceType - Type of service
 * @returns {Object} - Fare breakdown object
 */
export const calculateJobFare = async (distanceKm, serviceType) => {
  try {
    // Get service-specific pricing
    const pricing = getServicePricing(serviceType);
    
    // Calculate fare using service-specific pricing formula
    const distanceCharge = distanceKm * pricing.ratePerKm;
    const totalFare = pricing.baseFee + distanceCharge;
    const finalFare = Math.max(totalFare, pricing.minFare);
    
    return {
      distance: parseFloat(distanceKm.toFixed(1)),
      baseFee: pricing.baseFee,
      distanceCharge: parseFloat(distanceCharge.toFixed(1)),
      totalFare: parseFloat(finalFare.toFixed(1)),
      serviceType: serviceType,
      ratePerKm: pricing.ratePerKm,
      minFare: pricing.minFare
    };
    
  } catch (error) {
    console.error('Error calculating job fare:', error.message);
    
    // Get default pricing for fallback
    const defaultPricing = getServicePricing(serviceType);
    
    // Return default values for API failures
    return {
      distance: 5.0, // Default distance
      baseFee: defaultPricing.baseFee,
      distanceCharge: 0,
      totalFare: defaultPricing.minFare,
      serviceType: serviceType,
      ratePerKm: defaultPricing.ratePerKm,
      minFare: defaultPricing.minFare
    };
  }
};

/**
 * Calculate complete fare data including distance and pricing
 * @param {Object} startCoords - Starting coordinates {lat, lng}
 * @param {Object} endCoords - Ending coordinates {lat, lng}
 * @param {string} serviceType - Type of service
 * @returns {Promise<Object>} - Complete fare breakdown
 */
export const calculateCompleteFareData = async (startCoords, endCoords, serviceType) => {
  try {
    // Calculate distance first
    const distanceKm = await calculateDistance(startCoords, endCoords);
    
    // Then calculate fare based on distance
    const fareData = await calculateJobFare(distanceKm, serviceType);
    
    return fareData;
    
  } catch (error) {
    console.error('Error calculating complete fare data:', error.message);
    
    // Return default fare data
    return {
      distance: 5.0,
      baseFee: 500,
      distanceCharge: 0,
      totalFare: 600,
      serviceType: serviceType,
      ratePerKm: 50,
      minFare: 600
    };
  }
};

/**
 * Nearest provider within 5km, excluding ignored user ids.
 */
export const findNearestProvider = async (lng, lat, ignoredByIds = []) => {
  const query = {
    role: 'provider',
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)],
        },
        $maxDistance: 5000,
      },
    },
  };

  if (ignoredByIds?.length) {
    query._id = { $nin: ignoredByIds };
  }

  const provider = await User.findOne(query).select('_id name phone providerInfo location');

  return provider;
};

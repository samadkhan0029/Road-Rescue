// Authentication utility functions for frontend
import axios from 'axios';

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  // Password must be at least 8 characters, contain at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validate phone number
export const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Validate JWT token format
export const validateToken = (token) => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    return parts.length === 3; // Basic JWT validation
  } catch {
    return false;
  }
};

// Get auth token from localStorage
export const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  return validateToken(token) ? token : null;
};

// Get current user from localStorage
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!(token && user);
};

// Check if user is provider
export const isProvider = () => {
  const user = getCurrentUser();
  return user && (user.role === 'provider' || user.role === 'garage');
};

// Check if user is regular user
export const isUser = () => {
  const user = getCurrentUser();
  return user && (user.role === 'user' || user.role === 'customer');
};

// Logout user and clear all auth data
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentUserName');
  localStorage.removeItem('rememberedEmail');
  window.location.href = '/login';
};

// Get authorization header for API calls
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? `Bearer ${token}` : '';
};

// Make authenticated API call with automatic token validation
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    logout();
    return null;
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, finalOptions);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      logout();
      return null;
    }

    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Format user display name
export const getDisplayName = () => {
  const user = getCurrentUser();
  return user ? user.name || user.fullName : localStorage.getItem('currentUserName') || 'User';
};

// Get user initials for avatar
export const getUserInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Check if session is still valid
export const checkSessionValidity = () => {
  const token = getAuthToken();
  const user = getCurrentUser();
  
  if (!token || !user) {
    return false;
  }
  
  // Additional validation can be added here (like token expiration check)
  return true;
};

// Clear invalid session data
export const clearInvalidSession = () => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('currentUser');
  
  if (token && !validateToken(token)) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserName');
    return true;
  }
  
  if (user) {
    try {
      JSON.parse(user);
    } catch {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserName');
      return true;
    }
  }
  
  return false;
};

// ==================== FARE CALCULATOR FUNCTIONS ====================

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
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || '2147625628e7408baf97ef929225f25a';
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
 * Calculate route data including distance and fare between two coordinates with service-specific pricing
 * @param {Object} startCoords - Starting coordinates {lat, lng}
 * @param {Object} endCoords - Ending coordinates {lat, lng}
 * @param {string} serviceType - Type of service for pricing
 * @returns {Promise<Object>} - Object containing distance, fare, and breakdown
 */
export const calculateRouteData = async (startCoords, endCoords, serviceType = 'Towing Service') => {
  try {
    // Validate input coordinates
    if (!startCoords || !endCoords || 
        !startCoords.lat || !startCoords.lng || 
        !endCoords.lat || !endCoords.lng) {
      throw new Error('Invalid coordinates provided');
    }

    // Get service-specific pricing
    const pricing = getServicePricing(serviceType);
    
    // Make API request to Geoapify Routing API
    const apiUrl = `${GEOAPIFY_BASE_URL}?waypoints=${startCoords.lat},${startCoords.lng}|${endCoords.lat},${endCoords.lng}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
    
    console.log('Calling Geoapify API for service:', serviceType, apiUrl);
    
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
    
    // Calculate fare using service-specific pricing formula
    const distanceCharge = distanceKm * pricing.ratePerKm;
    const totalFare = pricing.baseFee + distanceCharge;
    const finalFare = Math.max(totalFare, pricing.minFare);
    
    return {
      distance: `${distanceKm.toFixed(1)} km`,
      fare: `₹${Math.round(finalFare)}`,
      breakdown: {
        baseFee: `₹${pricing.baseFee}`,
        distanceCharge: `₹${Math.round(distanceCharge)}`,
        totalFare: `₹${Math.round(finalFare)}`,
        distanceKm: distanceKm.toFixed(1),
        ratePerKm: pricing.ratePerKm,
        serviceType: serviceType,
        color: pricing.color,
        icon: pricing.icon
      }
    };
    
  } catch (error) {
    console.error('Error calculating route data:', error.message);
    
    // Get default pricing for fallback
    const defaultPricing = getServicePricing(serviceType);
    
    // Return default values for API failures
    return {
      distance: "Calculation Pending",
      fare: `₹${defaultPricing.minFare} (Base)`,
      breakdown: {
        baseFee: `₹${defaultPricing.baseFee}`,
        distanceCharge: '₹0',
        totalFare: `₹${defaultPricing.minFare}`,
        distanceKm: '0',
        ratePerKm: defaultPricing.ratePerKm,
        serviceType: serviceType,
        color: defaultPricing.color,
        icon: defaultPricing.icon
      }
    };
  }
};

/**
 * Calculate fare for a given distance and service type (helper function)
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} serviceType - Type of service
 * @returns {number} - Calculated fare
 */
export const calculateFare = (distanceKm, serviceType = 'Towing Service') => {
  const pricing = getServicePricing(serviceType);
  const totalFare = pricing.baseFee + (distanceKm * pricing.ratePerKm);
  return Math.max(totalFare, pricing.minFare);
};

/**
 * Format distance for display
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} - Formatted distance string
 */
export const formatDistance = (distanceInMeters) => {
  const distanceKm = distanceInMeters / 1000;
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Get provider's current location (mock implementation - replace with actual GPS)
 * @returns {Object} - Provider coordinates {lat, lng}
 */
export const getProviderLocation = () => {
  // Mock location - replace with actual GPS implementation
  return {
    lat: 28.6139,  // Delhi coordinates (example)
    lng: 77.2090
  };
};

/**
 * Extract customer location from request data
 * @param {Object} requestData - Request data containing location
 * @returns {Object} - Customer coordinates {lat, lng}
 */
export const getCustomerLocation = (requestData) => {
  if (!requestData || !requestData.location) {
    throw new Error('Customer location not found in request data');
  }
  
  // Handle different location formats
  if (requestData.location.coordinates) {
    // GeoJSON format: [lng, lat]
    const [lng, lat] = requestData.location.coordinates;
    return { lat, lng };
  } else if (requestData.location.lat && requestData.location.lng) {
    // Direct format: {lat, lng}
    return {
      lat: requestData.location.lat,
      lng: requestData.location.lng
    };
  } else {
    throw new Error('Invalid location format in request data');
  }
};

/**
 * Get all available service types with their pricing
 * @returns {Array} - Array of service configurations
 */
export const getAllServicePricing = () => {
  return Object.entries(SERVICE_PRICING).map(([name, pricing]) => ({
    name,
    ...pricing
  }));
};

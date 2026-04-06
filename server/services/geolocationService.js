const axios = require('axios');

class GeolocationService {
  constructor() {
    this.nominatimUrl = 'https://nominatim.openstreetmap.org';
  }

  async reverseGeocode(lat, lng) {
    try {
      const response = await axios.get(`${this.nominatimUrl}/reverse`, {
        params: {
          format: 'json',
          lat,
          lon: lng,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'RoadRescue-App/1.0'
        }
      });

      if (response.data && response.data.display_name) {
        return {
          success: true,
          address: response.data.display_name,
          components: response.data.address || {}
        };
      } else {
        throw new Error('No address found for the given coordinates');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error.message);
      return {
        success: false,
        error: error.message,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      };
    }
  }

  async geocode(address) {
    try {
      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'RoadRescue-App/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          success: true,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        };
      } else {
        throw new Error('No coordinates found for the given address');
      }
    } catch (error) {
      console.error('Geocoding error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GeolocationService();

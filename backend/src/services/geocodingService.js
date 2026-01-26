const axios = require('axios');

class GeocodingService {
  constructor() {
    // Multiple geocoding services for reliability
    this.services = [
      {
        name: 'OpenStreetMap Nominatim',
        url: 'https://nominatim.openstreetmap.org/reverse',
        searchUrl: 'https://nominatim.openstreetmap.org/search',
        timeout: 5000
      },
      {
        name: 'Nominatim Alternative',
        url: 'https://nominatim.openstreetmap.org/reverse',
        searchUrl: 'https://nominatim.openstreetmap.org/search',
        timeout: 8000
      }
    ];
    
    this.currentServiceIndex = 0;
  }

  /**
   * Get current service
   */
  getCurrentService() {
    return this.services[this.currentServiceIndex];
  }

  /**
   * Switch to next service
   */
  switchService() {
    this.currentServiceIndex = (this.currentServiceIndex + 1) % this.services.length;
    console.log(`🔄 Switching to geocoding service: ${this.getCurrentService().name}`);
  }

  /**
   * Convert lat/lng to human-readable address with multiple fallbacks
   */
  async reverseGeocode(lat, lng) {
    const service = this.getCurrentService();
    
    try {
      const response = await axios.get(service.url, {
        params: {
          format: 'json',
          lat: lat,
          lon: lng,
          addressdetails: 1,
          zoom: 18,
          countrycodes: 'in' // India specific
        },
        headers: {
          'User-Agent': 'CivicMind/1.0 (municipal-complaint-system@example.com)'
        },
        timeout: service.timeout
      });

      if (response.data && response.data.address) {
        return this.formatAddress(response.data);
      } else {
        throw new Error('No address found for coordinates');
      }
    } catch (error) {
      console.warn(`⚠️ ${service.name} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Enhanced reverse geocoding with multiple service fallbacks
   */
  async reverseGeocodeWithRetry(lat, lng, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      for (let serviceAttempt = 0; serviceAttempt < this.services.length; serviceAttempt++) {
        try {
          console.log(`🗺️ Geocoding attempt ${attempt}/${maxRetries} using ${this.getCurrentService().name} for coordinates: ${lat}, ${lng}`);
          
          const address = await this.reverseGeocode(lat, lng);
          
          const validation = this.validateAddress(address);
          if (!validation.isValid) {
            console.warn(`⚠️ Address validation failed. Missing: ${validation.missing.join(', ')}`);
          }
          
          console.log('✅ Geocoding successful:', address.fullAddress);
          return address;
          
        } catch (error) {
          lastError = error;
          console.error(`❌ ${this.getCurrentService().name} failed:`, error.message);
          
          // Switch to next service
          if (serviceAttempt < this.services.length - 1) {
            this.switchService();
            // Add small delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Reset to first service for next attempt
      this.currentServiceIndex = 0;
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All attempts failed, return fallback
    console.error('🚨 All geocoding attempts failed, using fallback address');
    return this.getFallbackAddress(lat, lng);
  }

  /**
   * Format the address data from Nominatim response
   */
  formatAddress(data) {
    const address = data.address;
    
    return {
      fullAddress: data.display_name || this.createFallbackDisplayAddress(address),
      area: address.suburb || address.neighbourhood || address.district || '',
      locality: address.suburb || address.neighbourhood || address.district || '',
      city: address.city || address.town || address.village || address.county || 'Unknown City',
      state: address.state || 'Maharashtra', // Default to Maharashtra
      pincode: address.postcode || '',
      landmark: address.amenity || address.shop || address.tourism || ''
    };
  }

  /**
   * Create fallback display address
   */
  createFallbackDisplayAddress(address) {
    const parts = [];
    if (address.road) parts.push(address.road);
    if (address.suburb) parts.push(address.suburb);
    if (address.city || address.town) parts.push(address.city || address.town);
    if (address.state) parts.push(address.state);
    if (address.postcode) parts.push(address.postcode);
    
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  }

  /**
   * Fallback address when geocoding fails
   */
  getFallbackAddress(lat, lng) {
    return {
      fullAddress: `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
      area: 'Unknown Area',
      locality: 'Unknown Locality',
      city: 'Unknown City',
      state: 'Maharashtra',
      pincode: '',
      landmark: ''
    };
  }

  /**
   * Get municipality code from address
   */
  getMunicipalityCode(address) {
    const city = address.city?.toLowerCase() || '';
    const fullAddress = address.fullAddress?.toLowerCase() || '';
    
    const map = {
      'mumbai': 'BMC',
      'thane': 'TMC',
      'kalyan': 'KDMC',
      'pune': 'PMC',
      'nagpur': 'NMC',
      'nashik': 'NMC',
      'aurangabad': 'AMC',
      'navi mumbai': 'NMMC',
      'vasai-virar': 'VVMC',
      'brihan mumbai': 'BMC',
      'greater mumbai': 'BMC'
    };

    // Check both city and full address for municipality names
    for (const cityName in map) {
      if (city.includes(cityName) || fullAddress.includes(cityName)) {
        return map[cityName];
      }
    }

    return 'BMC'; // Default to BMC
  }

  /**
   * Validate address completeness
   */
  validateAddress(address) {
    const required = ['fullAddress', 'city'];
    const missing = required.filter(field => !address[field] || address[field].trim() === '');
    
    return {
      isValid: missing.length === 0,
      missing: missing
    };
  }

  /**
   * Search for address by name (forward geocoding)
   */
  async searchAddress(query) {
    const service = this.getCurrentService();
    
    try {
      const response = await axios.get(service.searchUrl, {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          countrycodes: 'in',
          limit: 5
        },
        headers: {
          'User-Agent': 'CivicMind/1.0 (municipal-complaint-system@example.com)'
        },
        timeout: service.timeout
      });

      return response.data.map(item => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: this.formatAddress(item)
      }));
    } catch (error) {
      console.error('Address search failed:', error.message);
      return [];
    }
  }

  /**
   * Batch geocoding for multiple coordinates
   */
  async batchGeocode(coordinates) {
    const results = [];
    
    for (const coord of coordinates) {
      try {
        const address = await this.reverseGeocodeWithRetry(coord.lat, coord.lng);
        results.push({
          ...coord,
          address,
          success: true
        });
      } catch (error) {
        results.push({
          ...coord,
          address: this.getFallbackAddress(coord.lat, coord.lng),
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Simple address generation from coordinates (mock geocoding)
   */
  generateMockAddress(lat, lng) {
    // Simple mock address generation for testing
    const mockAddresses = {
      '19.0760': 'Mumbai',
      '18.5204': 'Pune',
      '19.2183': 'Thane',
      '19.076': 'Mumbai',
      '18.520': 'Pune',
      '19.218': 'Thane'
    };

    const latKey = lat.toFixed(4);
    const city = mockAddresses[latKey] || 'Unknown City';
    
    return {
      fullAddress: `Mock Address, ${city}, Maharashtra, India`,
      area: 'Mock Area',
      locality: 'Mock Locality',
      city: city,
      state: 'Maharashtra',
      pincode: '400000',
      landmark: 'Mock Landmark'
    };
  }
}

module.exports = new GeocodingService();

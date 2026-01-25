const https = require('https');

/**
 * Reverse geocoding using OpenStreetMap Nominatim API (Free)
 * Converts lat/lng to human-readable address
 */
const reverseGeocode = async (lat, lng) => {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=en`;
    
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.error) {
            reject(new Error(result.error));
            return;
          }
          
          // Extract structured address components
          const address = parseNominatimResponse(result);
          resolve(address);
        } catch (error) {
          reject(new Error('Failed to parse geocoding response'));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(new Error(`Geocoding request failed: ${error.message}`));
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Geocoding request timeout'));
    });
    
    // Set headers to identify our application
    request.setHeader('User-Agent', 'CivicMind Complaint System (1.0)');
  });
};

/**
 * Parse Nominatim response into structured address
 */
const parseNominatimResponse = (result) => {
  const address = result.address || {};
  const displayName = result.display_name || 'Unknown Location';
  
  return {
    fullAddress: displayName,
    area: address.suburb || address.neighbourhood || address.residential || '',
    locality: address.city_district || address.district || address.suburb || '',
    city: address.city || address.town || address.village || 'Unknown',
    state: address.state || 'Maharashtra',
    pincode: address.postcode || '',
    landmark: address.road || address.pedestrian || address.building || '',
    raw: result // Keep raw response for debugging
  };
};

/**
 * Enhanced municipality detection based on address
 */
const getMunicipalityFromAddress = (address) => {
  const city = address.city?.toLowerCase() || '';
  const area = address.area?.toLowerCase() || '';
  const locality = address.locality?.toLowerCase() || '';
  const fullText = `${city} ${area} ${locality}`.toLowerCase();
  
  // Priority-based municipality mapping
  const municipalityMap = {
    // Mumbai (BMC) - highest priority for Mumbai areas
    'mumbai': 'BMC',
    'andheri': 'BMC',
    'bandra': 'BMC',
    'borivali': 'BMC',
    'dadar': 'BMC',
    'goregaon': 'BMC',
    'kurla': 'BMC',
    'malad': 'BMC',
    'santacruz': 'BMC',
    'vile parle': 'BMC',
    'worli': 'BMC',
    'churchgate': 'BMC',
    'colaba': 'BMC',
    
    // Thane (TMC)
    'thane': 'TMC',
    'thane city': 'TMC',
    'thane west': 'TMC',
    'thane east': 'TMC',
    
    // Kalyan-Dombivli (KDMC)
    'kalyan': 'KDMC',
    'dombivli': 'KDMC',
    'kalyan west': 'KDMC',
    'kalyan east': 'KDMC',
    'dombivli west': 'KDMC',
    'dombivli east': 'KDMC',
    
    // Pune (PMC)
    'pune': 'PMC',
    'pimpri': 'PMC',
    'chinchwad': 'PMC',
    'kothrud': 'PMC',
    'shivajinagar': 'PMC',
    
    // Others with fallback
    'nagpur': 'NMC',
    'nashik': 'NMC',
    'aurangabad': 'AMC'
  };
  
  // Check for exact matches first
  for (const [place, code] of Object.entries(municipalityMap)) {
    if (fullText.includes(place)) {
      return code;
    }
  }
  
  // Default to BMC if no match found
  return 'BMC';
};

module.exports = {
  reverseGeocode,
  getMunicipalityFromAddress
};

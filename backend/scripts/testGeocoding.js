const geocodingService = require('../src/services/geocodingService');

const testGeocoding = async () => {
  console.log('🗺️ Testing Geocoding Service');
  console.log('=============================');

  // Test Case 1: Mumbai coordinates
  console.log('\n📍 Test Case 1: Mumbai Coordinates (19.0760, 72.8777)');
  try {
    const address1 = await geocodingService.reverseGeocodeWithRetry(19.0760, 72.8777);
    console.log('✅ Success!');
    console.log('📋 Full Address:', address1.fullAddress);
    console.log('🏙️ City:', address1.city);
    console.log('🏛️ State:', address1.state);
    console.log('📮 PIN:', address1.pincode);
    console.log('🏢 Municipality Code:', geocodingService.getMunicipalityCode(address1));
    
    const validation = geocodingService.validateAddress(address1);
    console.log('✅ Validation:', validation.isValid ? 'PASSED' : 'FAILED');
    if (!validation.isValid) {
      console.log('⚠️ Missing fields:', validation.missing.join(', '));
    }
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  // Test Case 2: Pune coordinates
  console.log('\n📍 Test Case 2: Pune Coordinates (18.5204, 73.8567)');
  try {
    const address2 = await geocodingService.reverseGeocodeWithRetry(18.5204, 73.8567);
    console.log('✅ Success!');
    console.log('📋 Full Address:', address2.fullAddress);
    console.log('🏙️ City:', address2.city);
    console.log('🏛️ State:', address2.state);
    console.log('📮 PIN:', address2.pincode);
    console.log('🏢 Municipality Code:', geocodingService.getMunicipalityCode(address2));
    
    const validation = geocodingService.validateAddress(address2);
    console.log('✅ Validation:', validation.isValid ? 'PASSED' : 'FAILED');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  // Test Case 3: Address search
  console.log('\n🔍 Test Case 3: Address Search "Gateway of India Mumbai"');
  try {
    const searchResults = await geocodingService.searchAddress('Gateway of India Mumbai');
    console.log('✅ Search Results:', searchResults.length, 'found');
    searchResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.display_name}`);
      console.log(`     📍 Coordinates: ${result.lat}, ${result.lng}`);
      console.log(`     🏢 Municipality: ${geocodingService.getMunicipalityCode(result.address)}`);
    });
  } catch (error) {
    console.error('❌ Search failed:', error.message);
  }

  // Test Case 4: Invalid coordinates (fallback test)
  console.log('\n🚨 Test Case 4: Invalid Coordinates (0, 0)');
  try {
    const fallbackAddress = geocodingService.getFallbackAddress(0, 0);
    console.log('✅ Fallback Address Generated:');
    console.log('📋 Full Address:', fallbackAddress.fullAddress);
    console.log('🏙️ City:', fallbackAddress.city);
    console.log('✅ Validation:', geocodingService.validateAddress(fallbackAddress).isValid ? 'PASSED' : 'FAILED');
  } catch (error) {
    console.error('❌ Fallback failed:', error.message);
  }

  // Test Case 5: Batch geocoding
  console.log('\n📦 Test Case 5: Batch Geocoding');
  const coordinates = [
    { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
    { lat: 18.5204, lng: 73.8567, name: 'Pune' },
    { lat: 19.2183, lng: 72.9781, name: 'Thane' }
  ];

  try {
    const batchResults = await geocodingService.batchGeocode(coordinates);
    console.log('✅ Batch Results:');
    batchResults.forEach(result => {
      console.log(`  📍 ${result.name}: ${result.success ? '✅' : '❌'} ${result.address.city}`);
    });
  } catch (error) {
    console.error('❌ Batch geocoding failed:', error.message);
  }

  console.log('\n🎉 Geocoding Service Test Completed!');
  console.log('====================================');
};

// Run the test
testGeocoding();

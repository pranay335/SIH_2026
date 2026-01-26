// Test complaint filing without authentication
const testComplaintNoAuth = async () => {
  try {
    console.log('🧪 Testing Complaint API (No Auth)');
    console.log('==================================');

    const complaintData = {
      complaint_id: `NO_AUTH_TEST_${Date.now()}`,
      description: 'Water pipe broken on main road causing flooding',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      location: '19.0760,72.8777',
      nlp_result: {
        predicted_severity: 'High',
        predicted_sector: 'Water Supply',
        confidence: 0.85
      },
      cnn_result: {
        predicted_class: 'water_damage',
        confidence: 0.78
      },
      user_id: '507f1f77bcf86cd799439011'
    };

    console.log('📤 Sending complaint data:', {
      complaint_id: complaintData.complaint_id,
      description: complaintData.description,
      location: complaintData.location,
      has_nlp_result: !!complaintData.nlp_result,
      has_cnn_result: !!complaintData.cnn_result
    });

    // Try to call the geocoding endpoint first to test it
    console.log('\n🗺️ Testing geocoding endpoint...');
    const geoResponse = await fetch('http://localhost:5000/api/complaints/geocode?lat=19.0760&lng=72.8777');
    const geoData = await geoResponse.json();
    console.log('📥 Geocoding Status:', geoResponse.status);
    console.log('📥 Geocoding Data:', geoData);

    // Now try to file complaint (will fail due to auth but we can see the error)
    console.log('\n📝 Testing complaint endpoint...');
    const complaintResponse = await fetch('http://localhost:5000/api/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(complaintData)
    });

    const complaintDataResponse = await complaintResponse.json();
    console.log('📥 Complaint Status:', complaintResponse.status);
    console.log('📥 Complaint Response:', complaintDataResponse);

    if (complaintResponse.status === 401) {
      console.log('✅ Authentication is working (expected 401)');
    } else if (complaintResponse.status === 400) {
      console.log('⚠️ Validation error - this is what we need to fix');
      if (complaintDataResponse.message && complaintDataResponse.message.includes('address')) {
        console.log('🎯 Found the address validation error!');
      }
    } else {
      console.log('🤔 Unexpected response:', complaintResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testComplaintNoAuth();

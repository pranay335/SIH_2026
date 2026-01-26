// Full test: Login then file complaint
const testFullFlow = async () => {
  try {
    console.log('🧪 Testing Full Complaint Flow');
    console.log('==============================');

    // Step 1: Login to get token
    console.log('\n🔐 Step 1: Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'user@civic.com',
        password: 'user123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('📥 Login Status:', loginResponse.status);
    console.log('📥 Login Data:', loginData);

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful! Got token');

    // Step 2: File complaint
    console.log('\n📝 Step 2: Filing complaint...');
    const complaintData = {
      complaint_id: `FULL_TEST_${Date.now()}`,
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
      user_id: loginData.user._id
    };

    console.log('📤 Sending complaint data:', {
      complaint_id: complaintData.complaint_id,
      description: complaintData.description,
      location: complaintData.location,
      user_id: complaintData.user_id
    });

    const complaintResponse = await fetch('http://localhost:5000/api/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(complaintData)
    });

    const complaintDataResponse = await complaintResponse.json();
    console.log('📥 Complaint Status:', complaintResponse.status);
    console.log('📥 Complaint Response:', complaintDataResponse);

    if (complaintResponse.ok) {
      console.log('✅ Complaint filed successfully!');
      if (complaintDataResponse.deduplication) {
        console.log('🔄 Deduplication Info:', complaintDataResponse.deduplication.message);
      }
    } else {
      console.error('❌ Complaint filing failed:', complaintDataResponse.message);
      if (complaintDataResponse.errors) {
        console.error('❌ Validation Errors:', JSON.stringify(complaintDataResponse.errors, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testFullFlow();

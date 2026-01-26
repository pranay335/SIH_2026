// Test API call to file a complaint
const testComplaintAPI = async () => {
  try {
    console.log('🧪 Testing Complaint API Call');
    console.log('==============================');

    const complaintData = {
      complaint_id: `API_TEST_${Date.now()}`,
      description: 'Water pipe broken on main road',
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
      user_id: '507f1f77bcf86cd799439011' // Mock user ID
    };

    console.log('📤 Sending complaint data:', {
      complaint_id: complaintData.complaint_id,
      description: complaintData.description,
      location: complaintData.location,
      has_nlp_result: !!complaintData.nlp_result,
      has_cnn_result: !!complaintData.cnn_result
    });

    const response = await fetch('http://localhost:5000/api/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InVzZXJAY2l2aWMuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njk0NTI5MDJ9.example'
      },
      body: JSON.stringify(complaintData)
    });

    const data = await response.json();
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', data);

    if (response.ok) {
      console.log('✅ Complaint filed successfully!');
      if (data.deduplication) {
        console.log('🔄 Deduplication Info:', data.deduplication.message);
      }
    } else {
      console.error('❌ Complaint filing failed:', data.message);
    }

  } catch (error) {
    console.error('❌ API call failed:', error.message);
  }
};

// Run the test
testComplaintAPI();

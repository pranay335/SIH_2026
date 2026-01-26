const mongoose = require('mongoose');
const Complaint = require('../src/models/Complaint');
const geocodingService = require('../src/services/geocodingService');
require('dotenv').config();

const testComplaintSave = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    console.log('\n🧪 Testing Direct Complaint Save');
    console.log('==================================');

    // Test coordinates
    const testLat = 19.0760;
    const testLng = 72.8777;

    // Step 1: Get address
    console.log('\n🗺️ Step 1: Getting address...');
    const address = await geocodingService.reverseGeocodeWithRetry(testLat, testLng);
    console.log('✅ Address:', JSON.stringify(address, null, 2));

    // Step 2: Validate address
    console.log('\n✅ Step 2: Validating address...');
    const validation = geocodingService.validateAddress(address);
    console.log('Validation Result:', validation);

    // Step 3: Force valid address if needed
    let finalAddress = address;
    if (!validation.isValid) {
      console.log('🔧 Creating valid address...');
      finalAddress = {
        fullAddress: address.fullAddress || `Location (${testLat.toFixed(6)}, ${testLng.toFixed(6)})`,
        area: address.area || 'Unknown Area',
        locality: address.locality || 'Unknown Locality',
        city: address.city || 'Unknown City',
        state: address.state || 'Maharashtra',
        pincode: address.pincode || '',
        landmark: address.landmark || ''
      };
      console.log('✅ Final address:', JSON.stringify(finalAddress, null, 2));
    }

    // Step 4: Create complaint object
    console.log('\n📝 Step 3: Creating complaint object...');
    const complaintData = {
      complaint_id: `TEST_${Date.now()}`,
      description: 'Test complaint for address validation',
      image: 'data:image/jpeg;base64,test',
      location: {
        type: 'Point',
        coordinates: [testLng, testLat]
      },
      address: finalAddress,
      sector: 'Water Supply',
      municipalityCode: 'BMC',
      nlp_result: {
        predicted_severity: 'Medium',
        predicted_sector: 'Water Supply',
        confidence: 0.8
      },
      user_id: new mongoose.Types.ObjectId(),
      status: 'Pending',
      priority: 'Medium'
    };

    console.log('📋 Complaint data:', {
      complaint_id: complaintData.complaint_id,
      address_fullAddress: complaintData.address.fullAddress,
      address_city: complaintData.address.city,
      address_complete: !!complaintData.address.fullAddress && !!complaintData.address.city
    });

    // Step 5: Try to save
    console.log('\n💾 Step 4: Saving complaint...');
    const complaint = new Complaint(complaintData);
    
    try {
      const savedComplaint = await complaint.save();
      console.log('✅ Complaint saved successfully!');
      console.log('📋 Saved complaint ID:', savedComplaint.complaint_id);
      console.log('📍 Address:', savedComplaint.address.fullAddress);
      console.log('🏙️ City:', savedComplaint.address.city);
      
      // Clean up - delete the test complaint
      await Complaint.deleteOne({ _id: savedComplaint._id });
      console.log('🧹 Test complaint cleaned up');
      
    } catch (saveError) {
      console.error('❌ Save failed:', saveError.message);
      console.error('❌ Error details:', JSON.stringify(saveError.errors, null, 2));
    }

    console.log('\n🎉 Test Completed!');
    console.log('==================');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the test
testComplaintSave();

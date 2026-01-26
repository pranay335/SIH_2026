const mongoose = require('mongoose');
const deduplicationService = require('../src/services/deduplicationService');
require('dotenv').config();

const testDeduplication = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    console.log('\n🧪 Testing Complaint Deduplication System');
    console.log('==========================================');

    // Test Case 1: First complaint (should create new group)
    console.log('\n📝 Test Case 1: First complaint - Water pipe issue');
    const complaint1 = {
      _id: new mongoose.Types.ObjectId(),
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760] // Mumbai coordinates
      },
      address: {
        fullAddress: '123 Main Street, Mumbai, Maharashtra',
        area: 'Dadar',
        locality: 'Dadar West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400028'
      },
      sector: 'Water Supply',
      municipalityCode: 'BMC',
      description: 'Water pipe broken on main road causing flooding',
      nlp_result: {
        predicted_severity: 'High',
        predicted_sector: 'Water Supply',
        confidence: 0.85
      },
      user_id: new mongoose.Types.ObjectId(),
      image: 'water_pipe_1.jpg'
    };

    const result1 = await deduplicationService.processComplaint(complaint1);
    console.log('✅ Result:', result1.message);
    console.log('🆔 Group ID:', result1.group.group_id);
    console.log('📊 Complaint Count:', result1.group.complaint_count);

    // Test Case 2: Similar complaint nearby (should add to existing group)
    console.log('\n📝 Test Case 2: Similar complaint nearby');
    const complaint2 = {
      _id: new mongoose.Types.ObjectId(),
      location: {
        type: 'Point',
        coordinates: [72.8778, 19.0761] // 150m from first complaint
      },
      address: {
        fullAddress: '125 Main Street, Mumbai, Maharashtra',
        area: 'Dadar',
        locality: 'Dadar West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400028'
      },
      sector: 'Water Supply',
      municipalityCode: 'BMC',
      description: 'Leaking water pipe on main street flooding area',
      nlp_result: {
        predicted_severity: 'Medium',
        predicted_sector: 'Water Supply',
        confidence: 0.78
      },
      user_id: new mongoose.Types.ObjectId(),
      image: 'water_pipe_2.jpg'
    };

    const result2 = await deduplicationService.processComplaint(complaint2);
    console.log('✅ Result:', result2.message);
    console.log('🆔 Group ID:', result2.group.group_id);
    console.log('📊 Complaint Count:', result2.group.complaint_count);
    console.log('🎯 Priority:', result2.group.priority);

    // Test Case 3: Different sector (should create new group)
    console.log('\n📝 Test Case 3: Different sector - Street light issue');
    const complaint3 = {
      _id: new mongoose.Types.ObjectId(),
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760] // Same location as first
      },
      address: {
        fullAddress: '123 Main Street, Mumbai, Maharashtra',
        area: 'Dadar',
        locality: 'Dadar West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400028'
      },
      sector: 'Street Lighting',
      municipalityCode: 'BMC',
      description: 'Street light not working on main road',
      nlp_result: {
        predicted_severity: 'Low',
        predicted_sector: 'Street Lighting',
        confidence: 0.92
      },
      user_id: new mongoose.Types.ObjectId(),
      image: 'street_light_1.jpg'
    };

    const result3 = await deduplicationService.processComplaint(complaint3);
    console.log('✅ Result:', result3.message);
    console.log('🆔 Group ID:', result3.group.group_id);
    console.log('📊 Complaint Count:', result3.group.complaint_count);

    // Test Case 4: Far away complaint (should create new group)
    console.log('\n📝 Test Case 4: Far away complaint - Different area');
    const complaint4 = {
      _id: new mongoose.Types.ObjectId(),
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.1760] // 11km from first complaint
      },
      address: {
        fullAddress: '456 Park Avenue, Mumbai, Maharashtra',
        area: 'Bandra',
        locality: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050'
      },
      sector: 'Water Supply',
      municipalityCode: 'BMC',
      description: 'Water pipe broken near park',
      nlp_result: {
        predicted_severity: 'Medium',
        predicted_sector: 'Water Supply',
        confidence: 0.81
      },
      user_id: new mongoose.Types.ObjectId(),
      image: 'water_pipe_3.jpg'
    };

    const result4 = await deduplicationService.processComplaint(complaint4);
    console.log('✅ Result:', result4.message);
    console.log('🆔 Group ID:', result4.group.group_id);
    console.log('📊 Complaint Count:', result4.group.complaint_count);

    // Get deduplication statistics
    console.log('\n📊 Deduplication Statistics');
    console.log('===========================');
    const stats = await deduplicationService.getDeduplicationStats();
    console.log('🔢 Total Groups:', stats.totalGroups);
    console.log('📋 Total Complaints:', stats.totalComplaints);
    console.log('📈 Avg Complaints per Group:', stats.avgComplaintsPerGroup);
    console.log('🎯 Deduplication Rate:', stats.deduplicationRate + '%');
    
    console.log('\n📊 Groups by Status:');
    stats.groupsByStatus.forEach(status => {
      console.log(`  ${status._id}: ${status.count} groups`);
    });

    console.log('\n🎉 Deduplication System Test Completed Successfully!');
    console.log('==================================================');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the test
testDeduplication();

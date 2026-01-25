const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const connectDB = require('./src/config/database');

const seedData = async () => {
  try {
    // Connect to MongoDB using the same connection as backend
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing users (optional - remove if you want to keep existing data)
    console.log('Clearing existing seed users...');
    await User.deleteMany({ email: { $in: [
      'admin@civicmind.com',
      'admin@tmc.gov',
      'admin@kdmc.gov',
      'admin@pmc.gov',
      'employee@civicmind.com',
      'user@civicmind.com'
    ]}});

    // Create default admin (BMC)
    const adminExists = await User.findOne({ email: 'admin@civicmind.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const admin = new User({
        name: 'BMC Administrator',
        email: 'admin@civicmind.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+1234567890',
        municipalityCode: 'BMC'
      });

      await admin.save();
      console.log('✅ BMC Admin created');
    }

    // Create TMC admin
    const tmcAdminExists = await User.findOne({ email: 'admin@tmc.gov' });
    if (!tmcAdminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const tmcAdmin = new User({
        name: 'TMC Administrator',
        email: 'admin@tmc.gov',
        password: hashedPassword,
        role: 'admin',
        phone: '+1234567891',
        municipalityCode: 'TMC'
      });

      await tmcAdmin.save();
      console.log('✅ TMC Admin created');
    }

    // Create KDMC admin
    const kdmcAdminExists = await User.findOne({ email: 'admin@kdmc.gov' });
    if (!kdmcAdminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const kdmcAdmin = new User({
        name: 'KDMC Administrator',
        email: 'admin@kdmc.gov',
        password: hashedPassword,
        role: 'admin',
        phone: '+1234567892',
        municipalityCode: 'KDMC'
      });

      await kdmcAdmin.save();
      console.log('✅ KDMC Admin created');
    }

    // Create PMC admin
    const pmcAdminExists = await User.findOne({ email: 'admin@pmc.gov' });
    if (!pmcAdminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const pmcAdmin = new User({
        name: 'PMC Administrator',
        email: 'admin@pmc.gov',
        password: hashedPassword,
        role: 'admin',
        phone: '+1234567893',
        municipalityCode: 'PMC'
      });

      await pmcAdmin.save();
      console.log('✅ PMC Admin created');
    }

    // Create default employee
    const employeeExists = await User.findOne({ email: 'employee@civicmind.com' });
    if (!employeeExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('employee123', salt);
      
      const employee = new User({
        name: 'Test Employee',
        email: 'employee@civicmind.com',
        password: hashedPassword,
        role: 'employee',
        phone: '+1234567890',
        municipalityCode: 'BMC',
        department: 'General',
        designation: 'Field Officer',
        employeeId: 'EMP001',
        availabilityStatus: 'AVAILABLE',
        maxConcurrentComplaints: 5,
        skills: ['street_lighting', 'waste_management', 'road_repair'],
        performance: {
          totalComplaintsHandled: 0,
          successRate: 95,
          avgResolutionTime: 2.5,
          qualityScore: 92
        }
      });

      await employee.save();
      console.log('✅ Default employee created');
      console.log('📧 Email: employee@civicmind.com');
      console.log('🔑 Password: employee123');
      console.log('👤 Role: employee');
      console.log('🏢 Municipality: BMC');
      console.log('🔧 Department: Maintenance');
    }

    // Create default citizen user
    const userExists = await User.findOne({ email: 'user@civicmind.com' });
    if (!userExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('user123', salt);
      
      const user = new User({
        name: 'Test Citizen',
        email: 'user@civicmind.com',
        password: hashedPassword,
        role: 'user',
        phone: '+1234567890',
        municipalityCode: 'BMC'
      });

      await user.save();
      console.log('✅ Default citizen created');
      console.log('📧 Email: user@civicmind.com');
      console.log('🔑 Password: user123');
      console.log('👤 Role: user');
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────');
    console.log('🏛️  BMC Admin: admin@civicmind.com / admin123');
    console.log('🏛️  TMC Admin: admin@tmc.gov / admin123');
    console.log('🏛️  KDMC Admin: admin@kdmc.gov / admin123');
    console.log('🏛️  PMC Admin: admin@pmc.gov / admin123');
    console.log('👷 Employee: employee@civicmind.com / employee123');
    console.log('👤 Citizen: user@civicmind.com / user123');

  } catch (error) {
    console.error('❌ Error creating seed data:', error);
  } finally {
    // Don't disconnect if backend is running
    if (mongoose.connection.readyState === 1) {
      console.log('\n📡 Seed data completed, keeping MongoDB connection open');
    } else {
      await mongoose.disconnect();
      console.log('\n📡 Disconnected from MongoDB');
    }
    process.exit(0);
  }
};

// Run the seed function
seedData();

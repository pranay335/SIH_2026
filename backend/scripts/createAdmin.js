const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const fs = require('fs');

// Load .env file manually to handle UTF-16
const loadEnv = () => {
  try {
    const envPath = require('path').join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // If file is UTF-16, convert to UTF-8
    if (envContent.charCodeAt(0) === 0xFEFF) {
      envContent = envContent.slice(1);
    }
    
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key] = value.trim();
      }
    });
  } catch (error) {
    console.error('Error loading .env file:', error);
  }
};

const createDefaultAdmin = async () => {
  try {
    // Load environment variables
    loadEnv();
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@civicmind.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create default admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new User({
      name: 'System Administrator',
      email: 'admin@civicmind.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+1234567890'
    });

    await admin.save();
    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email: admin@civicmind.com');
    console.log('🔑 Password: admin123');
    console.log('🎭 Role: admin');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

createDefaultAdmin();

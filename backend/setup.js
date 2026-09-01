const fs = require('fs');
const path = require('path');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExample = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/complaints_db
NODE_ENV=development
JWT_SECRET=civicmind_jwt_secret_key_2024_secure_token`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envExample);
  console.log('✅ .env file created successfully');
} else {
  console.log('ℹ️ .env file already exists');
}

console.log('\n📋 Setup Instructions:');
console.log('1. Make sure MongoDB is installed and running on your system');
console.log('2. If using MongoDB Atlas, update MONGODB_URI in .env file');
console.log('3. Run "npm start" to start the backend server');
console.log('4. The server will be available at http://localhost:5000');
console.log('\n🔗 API Endpoints:');
console.log('- POST /api/users/register - Register new user');
console.log('- POST /api/users/login - Login user');
console.log('- GET /api/users/profile - Get user profile (protected)');

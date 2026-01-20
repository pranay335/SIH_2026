require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI || 'mongodb://localhost:27017/complaints_db';

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,   // modern, safe option
    });

    console.log('✅ MongoDB Connected successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

// Connect to database and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

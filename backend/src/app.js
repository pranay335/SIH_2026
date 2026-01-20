const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('🚀 Backend server is running!');
});

module.exports = app;
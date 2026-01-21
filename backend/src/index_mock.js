const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mock data storage
let complaints = [];
let users = [];
let complaintIdCounter = 1000;

// Mock users
users = [
  {
    _id: '1',
    name: 'Admin User',
    email: 'admin@civic.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    _id: '2',
    name: 'Test User',
    email: 'user@civic.com',
    password: 'user123',
    role: 'user'
  }
];

// Health check
app.get('/', (req, res) => {
  res.send('🚀 Mock Backend server is running!');
});

// User routes
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: 'mock_jwt_token_' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

// Complaint routes
app.post('/api/complaints', (req, res) => {
  const complaint = {
    _id: 'complaint_' + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  
  complaints.push(complaint);
  
  res.json({
    success: true,
    message: 'Complaint filed successfully',
    complaint: complaint
  });
});

app.get('/api/complaints', (req, res) => {
  res.json({
    success: true,
    complaints: complaints
  });
});

app.get('/api/complaints/:id', (req, res) => {
  const complaint = complaints.find(c => c._id === req.params.id);
  
  if (complaint) {
    res.json({
      success: true,
      complaint
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Complaint not found'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Mock Backend server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log('📝 Note: Running in mock mode - no database connection');
  console.log('🔗 Frontend should connect to: http://localhost:5000/api');
});

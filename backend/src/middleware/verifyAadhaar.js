const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyAadhaar = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    User.findById(decoded.userId).then(user => {
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      // Check Aadhaar verification
      if (!user.aadhaarVerified) {
        return res.status(403).json({ 
          message: 'Aadhaar verification required. Please complete Aadhaar verification first.' 
        });
      }

      req.user = user;
      next();
    });

  } catch (error) {
    console.error('Aadhaar verification middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = verifyAadhaar;

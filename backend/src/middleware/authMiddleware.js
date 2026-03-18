const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id)
        .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account deactivated. Please contact support.'
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
      }

      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Admin only
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized as admin' });
  }
};

// Seller only (or Admin)
exports.seller = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized as seller' });
  }
};

// FIX: Seller must also be approved (unless admin)
exports.approvedSeller = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  if (req.user && req.user.role === 'seller' && req.user.isSellerApproved) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Seller account not yet approved by admin.'
  });
};

// Courier only
exports.courier = (req, res, next) => {
  if (req.user && req.user.role === 'courier') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized as courier' });
  }
};

// Admin or Seller
exports.adminOrSeller = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'seller')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
};

// Optional auth - doesn't require token but attaches user if present
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }

  next();
};
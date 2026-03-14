const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('role').optional().isIn(['user', 'seller', 'courier']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const verifyValidation = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid OTP is required')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/verify', verifyValidation, authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', protect, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);
router.put('/change-password', protect, authController.changePassword);
router.post('/logout', protect, authController.logout);
router.get('/check', protect, authController.checkAuth);

module.exports = router;
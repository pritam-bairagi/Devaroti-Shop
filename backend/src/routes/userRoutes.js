const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Cart validation
const cartValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// Profile validation
const profileValidation = [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phoneNumber').optional(),
  body('address').optional()
];

// Routes
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, profileValidation, userController.updateProfile);

// Cart routes
router.post('/cart', protect, cartValidation, userController.addToCart);
router.put('/cart/:productId', protect, userController.updateCartItem);
router.delete('/cart/:productId', protect, userController.removeFromCart);
router.delete('/cart', protect, userController.clearCart);

// Favorites routes
router.get('/favorites', protect, userController.getFavorites);
router.post('/favorites/:productId', protect, userController.toggleFavorite);

// Address routes
router.post('/address', protect, userController.addAddress);

// Account management
router.delete('/account', protect, userController.deleteAccount);

// Admin only routes
router.get('/:id', protect, admin, userController.getUserById);

module.exports = router;
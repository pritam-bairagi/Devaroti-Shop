const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  toggleFavorite,
  getFavorites,
  addAddress,
  deleteAccount,
  getUserById
} = require('../controllers/userController');
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
router.get('/profile', protect, getProfile);
router.put('/profile', protect, profileValidation, updateProfile);

// Cart routes
router.post('/cart', protect, cartValidation, addToCart);
router.put('/cart/:productId', protect, updateCartItem);
router.delete('/cart/:productId', protect, removeFromCart);
router.delete('/cart', protect, clearCart);

// Favorites routes
router.get('/favorites', protect, getFavorites);
router.post('/favorites/:productId', protect, toggleFavorite);

// Address routes
router.post('/address', protect, addAddress);

// Account management
router.delete('/account', protect, deleteAccount);

// Admin only routes
router.get('/:id', protect, admin, getUserById);

module.exports = router;
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  trackOrder,
  updateOrderStatus,
  getSellerOrders
} = require('../controllers/orderController');
const { protect, admin, seller, adminOrSeller } = require('../middleware/authMiddleware');

// Validation
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('totalPrice').isNumeric().withMessage('Valid total price is required'),
  body('orderNumber').notEmpty().withMessage('Order number is required')
];

// Public route for tracking
router.get('/track/:orderNumber', trackOrder);

// Protected routes
router.post('/', protect, orderValidation, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/seller', protect, seller, getSellerOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/status', protect, adminOrSeller, updateOrderStatus);

module.exports = router;
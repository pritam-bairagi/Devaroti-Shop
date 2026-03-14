const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { protect, seller, adminOrSeller } = require('../middleware/authMiddleware');

// Validation rules
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('totalPrice').isNumeric().withMessage('Valid total price is required')
];

// Public route for tracking
router.get('/track/:orderNumber', orderController.trackOrder);

// Protected routes
router.post('/', protect, orderValidation, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.get('/seller', protect, seller, orderController.getSellerOrders);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/cancel', protect, orderController.cancelOrder);
router.put('/:id/status', protect, adminOrSeller, orderController.updateOrderStatus);

module.exports = router;
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes are protected and admin-only
router.use(protect, admin);

// ==================== DASHBOARD ROUTES ====================
router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/logs', adminController.getSystemLogs);

// ==================== USER MANAGEMENT ====================
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/approve-seller/:id', adminController.approveSeller);

// ==================== ORDER MANAGEMENT ====================
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id', adminController.updateOrder);

// ==================== PRODUCT MANAGEMENT ====================
router.get('/products', adminController.getAllProducts);

// ==================== TRANSACTION MANAGEMENT ====================
router.get('/transactions', adminController.getTransactions);
router.post('/transactions', adminController.createTransaction);

// ==================== SALES MANAGEMENT ====================
router.get('/sales', adminController.getSales);
router.post('/sales', adminController.createSale);

// ==================== PURCHASES MANAGEMENT ====================
router.get('/purchases', adminController.getPurchases);
router.post('/purchases', adminController.createPurchase);

module.exports = router;
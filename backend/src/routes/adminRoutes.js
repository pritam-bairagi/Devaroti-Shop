const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes require authentication + admin role
router.use(protect, admin);

// Dashboard
router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/logs', adminController.getSystemLogs);
router.get('/inventory', adminController.getInventoryReport);

// User Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/approve-seller/:id', adminController.approveSeller);

// Order Management
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id', adminController.updateOrder);

// Product Management
router.get('/products', adminController.getAllProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Transactions
router.get('/transactions', adminController.getTransactions);
router.post('/transactions', adminController.createTransaction);

// Sales & Purchases
router.get('/sales', adminController.getSales);
router.post('/sales', adminController.createSale);
router.get('/purchases', adminController.getPurchases);
router.post('/purchases', adminController.createPurchase);

// Export
router.get('/export/:type', adminController.exportData);

// Google Drive Backup
router.get('/google/auth', adminController.googleDriveAuth);
router.post('/google/backup', adminController.backupToGoogleDrive);

// FIX: /google/callback is intentionally NOT here.
// Google redirects back to this URL without a token so it cannot go through
// the admin middleware. It is registered as a public route in server.js:
//   app.get('/api/admin/google/callback', adminController.googleDriveCallback)

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllOrders,
  updateOrder,
  getAllProducts,
  approveSeller,
  getAnalytics,
  getTransactions,
  createTransaction,
  getSystemLogs,
  getSales,
  createSale,
  getPurchases,
  createPurchase
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes are protected and admin-only
router.use(protect, admin);

// Dashboard
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/logs', getSystemLogs);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/approve-seller/:id', approveSeller);

// Order management
router.get('/orders', getAllOrders);
router.put('/orders/:id', updateOrder);

// Product management
router.get('/products', getAllProducts);

// Transaction management
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);

// Sales management
router.get('/sales', getSales);
router.post('/sales', createSale);

// Purchases management
router.get('/purchases', getPurchases);
router.post('/purchases', createPurchase);

module.exports = router;
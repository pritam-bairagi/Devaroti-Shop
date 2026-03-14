const express = require('express');
const router = express.Router();
const {
  getSellerStats,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerOrders,
  updateSellerOrder,
  getSellerEarnings,
  requestWithdrawal,
  getSellerProfile,
  getSellerSales,
  createSellerSale,
  getSellerPurchases,
  createSellerPurchase,
  getSellerTransactions,
  createSellerTransaction,
  getSellerCustomers
} = require('../controllers/sellerController');
const { protect, seller } = require('../middleware/authMiddleware');

// All seller routes are protected and seller-only
router.use(protect, seller);

// Dashboard
router.get('/stats', getSellerStats);
router.get('/profile', getSellerProfile);
router.get('/earnings', getSellerEarnings);

// Product management
router.get('/products', getSellerProducts);
router.post('/products', createSellerProduct);
router.put('/products/:id', updateSellerProduct);
router.delete('/products/:id', deleteSellerProduct);

// Order management
router.get('/orders', getSellerOrders);
router.put('/orders/:id', updateSellerOrder);

// Customers (read-only)
router.get('/customers', getSellerCustomers);

// Financial
router.post('/withdraw', requestWithdrawal);

// Sales management
router.get('/sales', getSellerSales);
router.post('/sales', createSellerSale);

// Purchases management
router.get('/purchases', getSellerPurchases);
router.post('/purchases', createSellerPurchase);

// Transactions management
router.get('/transactions', getSellerTransactions);
router.post('/transactions', createSellerTransaction);

module.exports = router;
const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { protect, seller, approvedSeller } = require('../middleware/authMiddleware');

// All seller routes require authentication + seller role + seller approval
router.use(protect, seller, approvedSeller);

// Dashboard
router.get('/stats', sellerController.getSellerStats);
router.get('/profile', sellerController.getSellerProfile);
router.get('/earnings', sellerController.getSellerEarnings);

// Product management
router.get('/products', sellerController.getSellerProducts);
router.post('/products', sellerController.createSellerProduct);
router.put('/products/:id', sellerController.updateSellerProduct);
router.delete('/products/:id', sellerController.deleteSellerProduct);

// Order management
router.get('/orders', sellerController.getSellerOrders);
router.put('/orders/:id', sellerController.updateSellerOrder);

// Customers
router.get('/customers', sellerController.getSellerCustomers);

// Financial
router.post('/withdraw', sellerController.requestWithdrawal);

// Sales
router.get('/sales', sellerController.getSellerSales);
router.post('/sales', sellerController.createSellerSale);

// Purchases
router.get('/purchases', sellerController.getSellerPurchases);
router.post('/purchases', sellerController.createSellerPurchase);

// Transactions
router.get('/transactions', sellerController.getSellerTransactions);
router.post('/transactions', sellerController.createSellerTransaction);

router.get('/sync-balance', sellerController.syncBalance);

module.exports = router;
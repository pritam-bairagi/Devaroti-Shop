const express = require('express');
const router = express.Router();
const { protect, seller } = require('../middleware/authMiddleware');
const {
  createSellerProduct,
  getSellerProducts,
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

// All routes are protected and require seller role
router.use(protect);
router.use(seller);

// Profile routes
router.route('/profile')
  .get(getSellerProfile);

// Product routes
router.route('/products')
  .get(getSellerProducts)
  .post(createSellerProduct);

router.route('/products/:id')
  .put(updateSellerProduct)
  .delete(deleteSellerProduct);

// Order routes
router.route('/orders')
  .get(getSellerOrders);

router.route('/orders/:id')
  .put(updateSellerOrder);

// Earnings routes
router.route('/earnings')
  .get(getSellerEarnings);

router.route('/withdraw')
  .post(requestWithdrawal);

// Sales routes
router.route('/sales')
  .get(getSellerSales)
  .post(createSellerSale);

// Purchases routes
router.route('/purchases')
  .get(getSellerPurchases)
  .post(createSellerPurchase);

// Transactions routes
router.route('/transactions')
  .get(getSellerTransactions)
  .post(createSellerTransaction);

// Customers routes
router.route('/customers')
  .get(getSellerCustomers);

module.exports = router;
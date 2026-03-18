const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Get seller dashboard stats
// @route   GET /api/seller/stats
const getSellerStats = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      totalProducts, totalOrders, totalSales,
      totalEarnings, recentOrders, lowStockProducts,
      pendingOrders, salesChart, topProducts, ordersByStatus
    ] = await Promise.all([
      Product.countDocuments({ user: req.user.id, liveStatus: { $ne: 'archived' } }),
      Order.countDocuments({ 'sellers.sellerId': sellerId, createdAt: { $gte: start, $lte: end } }),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: 'delivered', createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: null, total: { $sum: '$sellers.subtotal' } } }
      ]),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: 'delivered', createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: null, total: { $sum: '$sellers.sellerEarnings' } } }
      ]),
      Order.find({ 'sellers.sellerId': sellerId })
        .populate('user', 'name email phoneNumber')
        .populate('items.product', 'name image')
        .sort({ createdAt: -1 }).limit(10),
      Product.find({
        user: req.user.id,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        liveStatus: { $ne: 'archived' }
      }).limit(20),
      Order.countDocuments({ 'sellers.sellerId': sellerId, status: 'pending' }),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: 'delivered', createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$sellers.sellerEarnings' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: 'delivered' } },
        { $unwind: '$items' },
        { $match: { 'items.seller': sellerId } },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalSold: -1 } }, { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' }
      ]),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const monthlySales = await Order.aggregate([
      { $match: { 'sellers.sellerId': sellerId, status: 'delivered' } },
      { $unwind: '$sellers' },
      { $match: { 'sellers.sellerId': sellerId } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$sellers.sellerEarnings' },
          orders: { $sum: 1 }
        }},
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        overview: {
          totalProducts,
          totalOrders,
          totalSales: totalSales[0]?.total || 0,
          totalEarnings: totalEarnings[0]?.total || 0,
          pendingOrders,
          lowStockCount: lowStockProducts.length
        },
        recentOrders,
        lowStockProducts,
        topProducts,
        salesChart,
        monthlySales,
        ordersByStatus
      }
    });
  } catch (error) {
    console.error('Seller stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch seller stats: ' + error.message });
  }
};

// @desc    Get seller products
const getSellerProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, liveStatus, search } = req.query;

    let query = { user: req.user.id };
    if (category) query.category = category;
    if (liveStatus) query.liveStatus = liveStatus;
    if (search) query.name = { $regex: search, $options: 'i' };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Product.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true, products,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch products: ' + error.message });
  }
};

// @desc    Create product (seller)
const createSellerProduct = async (req, res) => {
  try {
    const productData = { ...req.body, user: req.user.id };
    // FIX: keep price alias in sync
    if (!productData.price) productData.price = productData.sellingPrice;

    const product = await Product.create(productData);
    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: error.message || 'Failed to create product' });
  }
};

// @desc    Update product (seller)
const updateSellerProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // FIX: keep price alias in sync
    if (req.body.sellingPrice) req.body.price = req.body.sellingPrice;

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    return res.status(200).json({ success: true, product: updated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: error.message || 'Failed to update product' });
  }
};

// @desc    Delete product (seller - soft delete)
const deleteSellerProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.liveStatus = 'archived';
    await product.save();

    return res.status(200).json({ success: true, message: 'Product archived' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product: ' + error.message });
  }
};

// @desc    Get seller orders
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const { page = 1, limit = 20, status } = req.query;

    const query = { 'sellers.sellerId': sellerId };
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phoneNumber')
        .populate('items.product', 'name image sellingPrice')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum).limit(limitNum),
      Order.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true, orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch orders: ' + error.message });
  }
};

// @desc    Update seller order status
const updateSellerOrder = async (req, res) => {
  try {
    const { status, trackingNumber, courier, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isSeller = order.sellers.some(s => s.sellerId.toString() === req.user.id);
    if (!isSeller) return res.status(403).json({ success: false, message: 'Not authorized' });

    // FIX: validate allowed status transitions
    const allowedTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['out-for-delivery'],
      'out-for-delivery': ['delivered']
    };

    if (status && allowedTransitions[order.status] && !allowedTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from '${order.status}' to '${status}'`
      });
    }

    if (status) order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier) order.courier = courier;

    order.statusHistory.push({
      status: status || order.status,
      date: new Date(),
      note: note || 'Updated by seller',
      updatedBy: req.user.id
    });

    await order.save();
    return res.status(200).json({ success: true, message: 'Order updated', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order: ' + error.message });
  }
};

// @desc    Get seller earnings
const getSellerEarnings = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const { page = 1, limit = 20 } = req.query;

    const earnings = await Order.find({ 'sellers.sellerId': sellerId, status: 'delivered' })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const [total, pendingWithdrawal] = await Promise.all([
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: 'delivered' } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: null, totalEarnings: { $sum: '$sellers.sellerEarnings' }, totalCommission: { $sum: '$sellers.commission' }, totalOrders: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { user: req.user.id, type: 'Cash Out', status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      earnings,
      totals: {
        ...(total[0] || { totalEarnings: 0, totalCommission: 0, totalOrders: 0 }),
        pendingWithdrawal: pendingWithdrawal[0]?.total || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch earnings: ' + error.message });
  }
};

// @desc    Request withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, accountNumber, accountName } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is ৳100' });
    }

    const sellerId = new mongoose.Types.ObjectId(req.user.id);

    const [earnings, pendingWithdrawals] = await Promise.all([
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: 'delivered' } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: null, totalEarnings: { $sum: '$sellers.sellerEarnings' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: req.user.id, type: 'Cash Out', status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const availableBalance = (earnings[0]?.totalEarnings || 0) - (pendingWithdrawals[0]?.total || 0);

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ৳${availableBalance.toFixed(2)}`
      });
    }

    const withdrawal = await Transaction.create({
      type: 'Cash Out',
      amount,
      description: `Withdrawal request - ${paymentMethod}: ${accountNumber}`,
      category: 'withdrawals',
      paymentMethod,
      // FIX: metadata stored as plain object, not Map, for simpler querying
      metadata: { accountNumber, accountName, sellerId: req.user.id, sellerName: req.user.name },
      user: req.user.id,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted. Processing within 1-3 business days.',
      withdrawal
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit withdrawal request: ' + error.message });
  }
};

// @desc    Get seller profile
const getSellerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const [productCount, orderCount, totalEarnings] = await Promise.all([
      Product.countDocuments({ user: req.user.id }),
      Order.countDocuments({ 'sellers.sellerId': sellerId }),
      Order.aggregate([
        { $match: { 'sellers.sellerId': sellerId, status: 'delivered' } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: null, total: { $sum: '$sellers.sellerEarnings' } } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      seller: {
        ...user.toObject(),
        stats: {
          totalProducts: productCount,
          totalOrders: orderCount,
          totalEarnings: totalEarnings[0]?.total || 0
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch seller profile: ' + error.message });
  }
};

const getSellerSales = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [sales, total] = await Promise.all([
      Sale.find({ user: req.user.id })
        .populate('product', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Sale.countDocuments({ user: req.user.id })
    ]);

    return res.status(200).json({
      success: true, sales,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sales: ' + error.message });
  }
};

const createSellerSale = async (req, res) => {
  try {
    const { product, quantity, totalAmount, paymentMethod, description } = req.body;
    const productInfo = await Product.findOne({ _id: product, user: req.user.id });
    if (!productInfo) return res.status(404).json({ success: false, message: 'Product not found or not yours' });

    if (productInfo.stock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${productInfo.stock} units available` });
    }

    const purchasePrice = productInfo.purchasePrice * quantity;
    const profit = totalAmount - purchasePrice;

    const sale = await Sale.create({
      product, quantity,
      unitPrice: totalAmount / quantity,
      totalAmount, purchasePrice, profit,
      paymentMethod, notes: description,
      user: req.user.id
    });

    await Product.findByIdAndUpdate(product, { $inc: { stock: -quantity, soldCount: quantity } });

    return res.status(201).json({ success: true, sale });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSellerPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [purchases, total] = await Promise.all([
      Purchase.find({ user: req.user.id })
        .populate('product', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Purchase.countDocuments({ user: req.user.id })
    ]);

    return res.status(200).json({
      success: true, purchases,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch purchases: ' + error.message });
  }
};

const createSellerPurchase = async (req, res) => {
  try {
    const { product, quantity, totalAmount, description, supplierName, supplierPhone, paidAmount } = req.body;
    const productInfo = await Product.findOne({ _id: product, user: req.user.id });
    if (!productInfo) return res.status(404).json({ success: false, message: 'Product not found' });

    const paid = paidAmount !== undefined ? Number(paidAmount) : totalAmount;
    const paymentStatus = paid >= totalAmount ? 'paid' : paid > 0 ? 'partial' : 'pending';

    const purchase = await Purchase.create({
      product, quantity,
      unitPrice: totalAmount / quantity,
      totalAmount,
      supplier: { name: supplierName, phone: supplierPhone },
      notes: description,
      paidAmount: paid,
      paymentStatus,
      user: req.user.id
    });

    await Product.findByIdAndUpdate(product, { $inc: { stock: quantity } });

    return res.status(201).json({ success: true, purchase });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSellerTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Transaction.countDocuments({ user: req.user.id })
    ]);

    return res.status(200).json({
      success: true, transactions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions: ' + error.message });
  }
};

const createSellerTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.create({ ...req.body, user: req.user.id, status: 'completed' });
    return res.status(201).json({ success: true, transaction });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSellerCustomers = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const orders = await Order.find({ 'sellers.sellerId': sellerId })
      .populate('user', 'name email phoneNumber profilePic');

    const customersMap = new Map();
    orders.forEach(o => {
      if (!o.user) return;
      const key = o.user._id.toString();
      if (!customersMap.has(key)) {
        customersMap.set(key, { ...o.user.toObject(), orderCount: 1 });
      } else {
        customersMap.get(key).orderCount++;
      }
    });

    return res.status(200).json({ success: true, customers: Array.from(customersMap.values()) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customers: ' + error.message });
  }
};

module.exports = {
  getSellerStats, getSellerProducts, createSellerProduct, updateSellerProduct, deleteSellerProduct,
  getSellerOrders, updateSellerOrder, getSellerEarnings, requestWithdrawal, getSellerProfile,
  getSellerSales, createSellerSale, getSellerPurchases, createSellerPurchase,
  getSellerTransactions, createSellerTransaction, getSellerCustomers
};
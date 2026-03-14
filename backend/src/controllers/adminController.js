const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const { getDashboardStats } = require('../utils/analytics');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/emailTemplates');


// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Date range
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Parallel queries for performance
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalSales,
      totalRevenue,
      recentOrders,
      recentUsers,
      lowStockProducts,
      pendingOrders,
      topProducts,
      topSellers,
      dailyStats,
      activeUsers,
      stockStats
    ] = await Promise.all([
      // Total users
      User.countDocuments({ role: { $ne: 'admin' } }),
      
      // Total products
      Product.countDocuments({ liveStatus: { $ne: 'archived' } }),
      
      // Total orders
      Order.countDocuments(),
      
      // Total sales amount
      Order.aggregate([
        { $match: { status: 'delivered', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      
      // Total revenue (platform commission)
      Order.aggregate([
        { $match: { status: 'delivered', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$platformCommission' } } }
      ]),
      
      // Recent orders
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Recent users
      User.find({ role: { $ne: 'admin' } })
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Low stock products
      Product.find({
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        liveStatus: { $ne: 'archived' }
      })
        .populate('user', 'name shopName')
        .limit(20),
      
      // Pending orders count
      Order.countDocuments({ status: 'pending' }),
      
      // Top products
      Order.aggregate([
        { $unwind: '$items' },
        { $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }},
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        { $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }},
        { $unwind: '$product' }
      ]),
      
      // Top sellers
      Order.aggregate([
        { $unwind: '$items' },
        { $group: {
            _id: '$items.seller',
            totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orderCount: { $sum: 1 }
          }},
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
        { $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'seller'
          }},
        { $unwind: '$seller' }
      ]),
      
      // Daily stats for chart
      getDashboardStats(start, end),

      // Active users
      User.countDocuments({ role: { $ne: 'admin' }, isActive: true }),

      // Total stock value
      Product.aggregate([
        { $match: { liveStatus: { $ne: 'archived' } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$purchasePrice', '$stock'] } } } }
      ])
    ]);

    // Calculate totals
    const totalSalesAmount = totalSales.length > 0 ? totalSales[0].total : 0;
    const totalRevenueAmount = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    // Cash box calculation
    const cashIn = await Transaction.aggregate([
      { $match: { type: 'Cash In', date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const cashOut = await Transaction.aggregate([
      { $match: { type: 'Cash Out', date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalCashIn = cashIn.length > 0 ? cashIn[0].total : 0;
    const totalCashOut = cashOut.length > 0 ? cashOut[0].total : 0;

    // Profit/Loss calculation
    const totalPurchaseCost = await Purchase.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Monthly sales for the last 12 months
    const twelveMonthsAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const monthlySales = await Order.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo }, status: 'delivered' } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$totalPrice' }
        }},
      { $sort: { _id: 1 } }
    ]);


    const totalCost = totalPurchaseCost.length > 0 ? totalPurchaseCost[0].total : 0;
    const profit = totalSalesAmount - totalCost;

    // Inventory Aging (created more than 30 days ago and still in stock)
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const inventoryAging = await Product.find({
      createdAt: { $lt: thirtyDaysAgo },
      stock: { $gt: 0 },
      liveStatus: { $ne: 'archived' }
    }).limit(10);


    const totalStockValue = stockStats.length > 0 ? stockStats[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalProducts,
        totalOrders,
        totalSales: totalSalesAmount,
        totalRevenue: totalRevenueAmount,
        pendingOrders,
        totalProfit: profit > 0 ? profit : 0,
        totalLoss: profit < 0 ? Math.abs(profit) : 0,
        totalCashIn,
        totalCashOut,
        totalCashBox: totalCashIn - totalCashOut,
        totalCost,
        totalStockValue,

        recentOrders,
        recentUsers,
        lowStockProducts,
        topProducts: topProducts.map(p => ({
            product: p.product,
            totalSold: p.totalSold
        })),
        topSellers,
        dailyStats: dailyStats.map(d => ({
            _id: d._id,
            sales: d.sales
        })),
        monthlySales,
        inventoryAging,

        lowStockCount: lowStockProducts.length
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard stats' 
    });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      role, 
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users' 
    });
  }
};

// @desc    Update user (admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Fields that admin can update
    const updateFields = [
      'name', 'email', 'phoneNumber', 'role', 'shopName', 
      'isVerified', 'isActive', 'address', 'location',
      'paymentMethod', 'paymentDetails', 'cashBox'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user' 
    });
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Don't allow deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    // Soft delete - deactivate instead of removing
    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user' 
    });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      paymentStatus,
      startDate,
      endDate,
      search
    } = req.query;

    // Build query
    let query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phoneNumber': { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('items.product', 'name image sellingPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments(query);

    // Get order statistics
    const stats = await Order.aggregate([
      { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalPrice' }
        }}
    ]);

    res.status(200).json({
      success: true,
      orders,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders' 
    });
  }
};

// @desc    Update order (admin)
// @route   PUT /api/admin/orders/:id
// @access  Private/Admin
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Update allowed fields
    const updateFields = [
      'status', 'paymentStatus', 'trackingNumber', 'courier',
      'deliveryOption', 'estimatedDeliveryDate', 'actualDeliveryDate',
      'adminNotes', 'platformCommission'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        order[field] = req.body[field];
      }
    });

    // Add to status history
    if (req.body.status && req.body.status !== order.status) {
      order.statusHistory.push({
        status: req.body.status,
        date: new Date(),
        note: req.body.statusNote || `Status updated by admin`,
        updatedBy: req.user.id
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update order' 
    });
  }
};

// @desc    Get all products (admin)
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search,
      category,
      status,
      seller,
      lowStock
    } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;
    if (status) query.liveStatus = status;
    if (seller) query.user = seller;
    
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .populate('user', 'name shopName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products' 
    });
  }
};

// @desc    Approve seller
// @route   PUT /api/admin/approve-seller/:id
// @access  Private/Admin
exports.approveSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.role !== 'seller') {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not a seller' 
      });
    }

    user.isSellerApproved = true;
    await user.save();

    // Send approval email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Seller Account Approved - Parash Feri',
        html: emailTemplates.sellerApproval(user.name)
      });
    } catch (emailError) {
      console.error('Approval email error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Seller approved successfully'
    });
  } catch (error) {
    console.error('Approve seller error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve seller' 
    });
  }
};

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let groupFormat;
    let startDate;

    switch (period) {
      case 'week':
        groupFormat = '%Y-%m-%d';
        startDate = new Date(new Date().setDate(new Date().getDate() - 7));
        break;
      case 'month':
        groupFormat = '%Y-%m-%d';
        startDate = new Date(new Date().setDate(new Date().getDate() - 30));
        break;
      case 'year':
        groupFormat = '%Y-%m';
        startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        break;
      default:
        groupFormat = '%Y-%m-%d';
        startDate = new Date(new Date().setDate(new Date().getDate() - 30));
    }

    // Sales over time
    const salesOverTime = await Order.aggregate([
      { $match: { 
          createdAt: { $gte: startDate },
          status: 'delivered'
        }},
      { $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          sales: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
          revenue: { $sum: '$platformCommission' }
        }},
      { $sort: { _id: 1 } }
    ]);

    // Top categories
    const topCategories = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }},
      { $unwind: '$product' },
      { $group: {
          _id: '$product.category',
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }},
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);

    // User growth
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          users: { $sum: 1 }
        }},
      { $sort: { _id: 1 } }
    ]);

    // Seller performance
    const sellerPerformance = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.seller',
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 },
          commission: { $sum: { $multiply: ['$items.price', '$items.quantity', 0.02] } } // 2% commission
        }},
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'seller'
        }},
      { $unwind: '$seller' }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        salesOverTime,
        topCategories,
        userGrowth,
        sellerPerformance
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics' 
    });
  }
};

// @desc    Get all transactions (admin)
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type,
      category,
      startDate,
      endDate
    } = req.query;

    // Build query
    let query = {};

    if (type) query.type = type;
    if (category) query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const transactions = await Transaction.find(query)
      .populate('user', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Transaction.countDocuments(query);

    // Get summary
    const summary = await Transaction.aggregate([
      { $match: query },
      { $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }}
    ]);

    res.status(200).json({
      success: true,
      transactions,
      summary,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch transactions' 
    });
  }
};

// @desc    Create transaction (admin)
// @route   POST /api/admin/transactions
// @access  Private/Admin
exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, description, category, paymentMethod } = req.body;

    const transaction = await Transaction.create({
      type,
      amount,
      description,
      category,
      paymentMethod,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create transaction' 
    });
  }
};

// @desc    Get system logs (admin)
// @route   GET /api/admin/logs
// @access  Private/Admin
exports.getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, level } = req.query;

    // This would typically come from a logging system
    // For now, return a placeholder
    res.status(200).json({
      success: true,
      logs: [],
      message: 'Logs feature coming soon'
    });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs'
    });
  }
};

// @desc    Get sales (admin)
// @route   GET /api/admin/sales
// @access  Private/Admin
exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate('product', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, sales });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales' });
  }
};

// @desc    Create sale (admin)
// @route   POST /api/admin/sales
// @access  Private/Admin
exports.createSale = async (req, res) => {
  try {
    const { product, quantity, totalAmount, paymentMethod, description } = req.body;
    const productInfo = await Product.findById(product);
    if (!productInfo) return res.status(404).json({ success: false, message: 'Product not found' });

    const purchasePrice = productInfo.purchasePrice * quantity;
    const profit = totalAmount - purchasePrice;

    const sale = await Sale.create({
      product,
      quantity,
      unitPrice: totalAmount / quantity,
      totalAmount,
      purchasePrice,
      profit,
      paymentMethod,
      notes: description,
      user: req.user.id
    });
    
    productInfo.stock -= quantity;
    await productInfo.save();

    res.status(201).json({ success: true, sale });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ success: false, message: 'Failed to create sale' });
  }
};

// @desc    Get purchases (admin)
// @route   GET /api/admin/purchases
// @access  Private/Admin
exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('product', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, purchases });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
};

// @desc    Create purchase (admin)
// @route   POST /api/admin/purchases
// @access  Private/Admin
exports.createPurchase = async (req, res) => {
  try {
    const { product, quantity, totalAmount, description } = req.body;
    const productInfo = await Product.findById(product);
    if (!productInfo) return res.status(404).json({ success: false, message: 'Product not found' });

    const purchase = await Purchase.create({
      product,
      quantity,
      unitPrice: totalAmount / quantity,
      totalAmount,
      notes: description,
      user: req.user.id
    });
    
    productInfo.stock += Number(quantity);
    await productInfo.save();

    res.status(201).json({ success: true, purchase });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ success: false, message: 'Failed to create purchase' });
  }
};

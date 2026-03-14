const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');

// @desc    Get seller dashboard stats
// @route   GET /api/seller/stats
// @access  Private/Seller
exports.getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { startDate, endDate } = req.query;

    // Date range
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Parallel queries
    const [
      totalProducts,
      totalOrders,
      totalSales,
      totalEarnings,
      recentOrders,
      lowStockProducts,
      pendingOrders,
      salesChart
    ] = await Promise.all([
      // Total products
      Product.countDocuments({ user: sellerId, liveStatus: { $ne: 'archived' } }),
      
      // Total orders (containing seller's products)
      Order.countDocuments({ 
        'sellers.sellerId': sellerId,
        createdAt: { $gte: start, $lte: end }
      }),
      
      // Total sales amount
      Order.aggregate([
        { $match: { 
            'sellers.sellerId': sellerId,
            status: 'delivered',
            createdAt: { $gte: start, $lte: end }
          }},
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: null, total: { $sum: '$sellers.subtotal' } } }
      ]),
      
      // Total earnings (after commission)
      Order.aggregate([
        { $match: { 
            'sellers.sellerId': sellerId,
            status: 'delivered',
            createdAt: { $gte: start, $lte: end }
          }},
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: { _id: null, total: { $sum: '$sellers.sellerEarnings' } } }
      ]),
      
      // Recent orders
      Order.find({ 'sellers.sellerId': sellerId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Low stock products
      Product.find({
        user: sellerId,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        liveStatus: { $ne: 'archived' }
      }).limit(20),
      
      // Pending orders count
      Order.countDocuments({ 
        'sellers.sellerId': sellerId,
        status: 'pending'
      }),
      
      // Daily sales for chart
      Order.aggregate([
        { $match: { 
            'sellers.sellerId': sellerId,
            status: 'delivered',
            createdAt: { $gte: start, $lte: end }
          }},
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': sellerId } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            sales: { $sum: '$sellers.sellerEarnings' },
            orders: { $sum: 1 }
          }},
        { $sort: { _id: 1 } }
      ])
    ]);

    // Calculate totals
    const totalSalesAmount = totalSales.length > 0 ? totalSales[0].total : 0;
    const totalEarningsAmount = totalEarnings.length > 0 ? totalEarnings[0].total : 0;

    // Get top products
    const topProducts = await Order.aggregate([
      { $match: { 'sellers.sellerId': sellerId, status: 'delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
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
    ]);

    res.status(200).json({
      success: true,
      stats: {
        overview: {
          totalProducts,
          totalOrders,
          totalSales: totalSalesAmount,
          totalEarnings: totalEarningsAmount,
          pendingOrders,
          lowStockCount: lowStockProducts.length
        },
        recentOrders,
        lowStockProducts,
        topProducts,
        salesChart
      }
    });
  } catch (error) {
    console.error('Seller stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch seller stats' 
    });
  }
};

// @desc    Get seller products
// @route   GET /api/seller/products
// @access  Private/Seller
exports.getSellerProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = { user: req.user.id };
    if (status) query.liveStatus = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
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
    console.error('Get seller products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products' 
    });
  }
};

// @desc    Create seller product
// @route   POST /api/seller/products
// @access  Private/Seller
exports.createSellerProduct = async (req, res) => {
  try {
    const { 
      name, description, sellingPrice, purchasePrice, 
      unit, category, image, stock, sku, brand 
    } = req.body;

    // Check SKU uniqueness
    if (sku) {
      const existing = await Product.findOne({ sku });
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: 'SKU already exists' 
        });
      }
    }

    const productData = {
      name,
      description,
      sellingPrice: Number(sellingPrice),
      purchasePrice: Number(purchasePrice),
      price: Number(sellingPrice),
      unit: unit || 'পিস',
      category,
      brand,
      image,
      stock: Number(stock) || 0,
      user: req.user.id,
      liveStatus: 'live' // Default to live so it's visible immediately
    };

    if (sku && sku.trim() !== "") {
      productData.sku = sku;
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create seller product error:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create product' 
    });
  }
};

// @desc    Update seller product
// @route   PUT /api/seller/products/:id
// @access  Private/Seller
exports.updateSellerProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Update allowed fields
    const updateFields = [
      'name', 'description', 'sellingPrice', 'purchasePrice',
      'unit', 'category', 'brand', 'image', 'stock', 'sku',
      'lowStockThreshold', 'tags'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // Update price alias
    if (req.body.sellingPrice) {
      product.price = req.body.sellingPrice;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update seller product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update product' 
    });
  }
};

// @desc    Delete seller product
// @route   DELETE /api/seller/products/:id
// @access  Private/Seller
exports.deleteSellerProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Soft delete
    product.liveStatus = 'archived';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete seller product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete product' 
    });
  }
};

// @desc    Get seller orders
// @route   GET /api/seller/orders
// @access  Private/Seller
exports.getSellerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { 'sellers.sellerId': req.user.id };
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments(query);

    // Calculate seller-specific data
    const ordersWithSellerData = orders.map(order => {
      const sellerInfo = order.sellers.find(
        s => s.sellerId.toString() === req.user.id
      );
      
      return {
        ...order.toObject(),
        sellerItems: sellerInfo?.items || [],
        sellerSubtotal: sellerInfo?.subtotal || 0,
        sellerCommission: sellerInfo?.commission || 0,
        sellerEarnings: sellerInfo?.sellerEarnings || 0
      };
    });

    res.status(200).json({
      success: true,
      orders: ordersWithSellerData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders' 
    });
  }
};

// @desc    Update order status (seller)
// @route   PUT /api/seller/orders/:id
// @access  Private/Seller
exports.updateSellerOrder = async (req, res) => {
  try {
    const { status, trackingNumber, courier, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if seller has items in this order
    const hasSellerItems = order.sellers.some(
      s => s.sellerId.toString() === req.user.id
    );

    if (!hasSellerItems) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this order' 
      });
    }

    // Update fields
    if (status) {
      order.status = status;
      
      if (status === 'delivered') {
        order.actualDeliveryDate = new Date();
      }
    }
    
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier) order.courier = courier;

    order.statusHistory.push({
      status: status || order.status,
      date: new Date(),
      note: note || `Status updated by seller`,
      updatedBy: req.user.id
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error('Update seller order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update order' 
    });
  }
};

// @desc    Get seller earnings
// @route   GET /api/seller/earnings
// @access  Private/Seller
exports.getSellerEarnings = async (req, res) => {
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

    const earnings = await Order.aggregate([
      { $match: { 
          'sellers.sellerId': req.user.id,
          status: 'delivered',
          createdAt: { $gte: startDate }
        }},
      { $unwind: '$sellers' },
      { $match: { 'sellers.sellerId': req.user.id } },
      { $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          earnings: { $sum: '$sellers.sellerEarnings' },
          commission: { $sum: '$sellers.commission' },
          orders: { $sum: 1 }
        }},
      { $sort: { _id: 1 } }
    ]);

    // Total earnings
    const total = await Order.aggregate([
      { $match: { 
          'sellers.sellerId': req.user.id,
          status: 'delivered'
        }},
      { $unwind: '$sellers' },
      { $match: { 'sellers.sellerId': req.user.id } },
      { $group: {
          _id: null,
          totalEarnings: { $sum: '$sellers.sellerEarnings' },
          totalCommission: { $sum: '$sellers.commission' },
          totalOrders: { $sum: 1 }
        }}
    ]);

    res.status(200).json({
      success: true,
      earnings,
      totals: total[0] || { totalEarnings: 0, totalCommission: 0, totalOrders: 0 }
    });
  } catch (error) {
    console.error('Get seller earnings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch earnings' 
    });
  }
};

// @desc    Request withdrawal
// @route   POST /api/seller/withdraw
// @access  Private/Seller
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, accountDetails } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum withdrawal amount is 100' 
      });
    }

    // Check available balance
    const earnings = await Order.aggregate([
      { $match: { 
          'sellers.sellerId': req.user.id,
          status: 'delivered'
        }},
      { $unwind: '$sellers' },
      { $match: { 'sellers.sellerId': req.user.id } },
      { $group: {
          _id: null,
          totalEarnings: { $sum: '$sellers.sellerEarnings' }
        }}
    ]);

    const availableBalance = earnings[0]?.totalEarnings || 0;

    if (amount > availableBalance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    // Create withdrawal request (as transaction)
    const withdrawal = await Transaction.create({
      type: 'Cash Out',
      amount,
      description: `Withdrawal request for seller ${req.user.name}`,
      category: 'withdrawals',
      paymentMethod,
      metadata: {
        accountDetails,
        sellerId: req.user.id,
        sellerName: req.user.name
      },
      user: req.user.id,
      status: 'pending'
    });

    // Update pending withdrawals
    const user = await User.findById(req.user.id);
    user.pendingWithdrawals = (user.pendingWithdrawals || 0) + amount;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted',
      withdrawal
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit withdrawal request' 
    });
  }
};

// @desc    Get seller profile
// @route   GET /api/seller/profile
// @access  Private/Seller
exports.getSellerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires -cart -favorites');

    // Get seller stats
    const [
      productCount,
      orderCount,
      totalEarnings
    ] = await Promise.all([
      Product.countDocuments({ user: req.user.id, liveStatus: { $ne: 'archived' } }),
      Order.countDocuments({ 'sellers.sellerId': req.user.id }),
      Order.aggregate([
        { $match: { 'sellers.sellerId': req.user.id, status: 'delivered' } },
        { $unwind: '$sellers' },
        { $match: { 'sellers.sellerId': req.user.id } },
        { $group: { _id: null, total: { $sum: '$sellers.sellerEarnings' } } }
      ])
    ]);

    res.status(200).json({
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
    console.error('Get seller profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch seller profile' 
    });
  }
};

// @desc    Get sales (seller)
// @route   GET /api/seller/sales
// @access  Private/Seller
exports.getSellerSales = async (req, res) => {
  try {
    const sales = await Sale.find({ user: req.user.id }).populate('product', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, sales });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales' });
  }
};

// @desc    Create sale (seller)
// @route   POST /api/seller/sales
// @access  Private/Seller
exports.createSellerSale = async (req, res) => {
  try {
    const { product, quantity, totalAmount, paymentMethod, description } = req.body;
    const productInfo = await Product.findOne({ _id: product, user: req.user.id });
    if (!productInfo) return res.status(404).json({ success: false, message: 'Product not found or not yours' });

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
    res.status(500).json({ success: false, message: error.message || 'Failed to create sale' });
  }
};

// @desc    Get purchases (seller)
// @route   GET /api/seller/purchases
// @access  Private/Seller
exports.getSellerPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user.id }).populate('product', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, purchases });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
};

// @desc    Create purchase (seller)
// @route   POST /api/seller/purchases
// @access  Private/Seller
exports.createSellerPurchase = async (req, res) => {
  try {
    const { product, quantity, totalAmount, description } = req.body;
    const productInfo = await Product.findOne({ _id: product, user: req.user.id });
    if (!productInfo) return res.status(404).json({ success: false, message: 'Product not found or not yours' });

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

// @desc    Get transactions (seller)
// @route   GET /api/seller/transactions
// @access  Private/Seller
exports.getSellerTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

// @desc    Create transaction (seller)
// @route   POST /api/seller/transactions
// @access  Private/Seller
exports.createSellerTransaction = async (req, res) => {
  try {
    const { type, amount, description, reference, paymentMethod } = req.body;

    const transaction = await Transaction.create({
      type,
      amount,
      description,
      reference,
      paymentMethod,
      user: req.user.id,
      status: 'completed'
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to create transaction' });
  }
};

// @desc    Get customers of seller (read-only)
// @route   GET /api/seller/customers
// @access  Private/Seller
exports.getSellerCustomers = async (req, res) => {
  try {
    const orders = await Order.find({ 'sellers.sellerId': req.user.id }).populate('user', 'name email phoneNumber');
    const customersMap = new Map();
    orders.forEach(o => {
      if (o.user && !customersMap.has(o.user._id.toString())) {
        customersMap.set(o.user._id.toString(), o.user);
      }
    });

    res.status(200).json({ success: true, customers: Array.from(customersMap.values()) });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
};
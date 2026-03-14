const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      items,
      subtotal,
      discount,
      vat,
      shippingCost,
      totalPrice,
      shippingAddress,
      billingAddress,
      paymentMethod,
      deliveryOption,
      deliveryInstructions
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items'
      });
    }

    // Verify stock and calculate seller earnings
    const processedItems = [];
    let platformCommission = 0;
    let sellerEarnings = 0;
    const sellerItems = {};

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      // Calculate commission (2% platform fee)
      const itemTotal = item.price * item.quantity;
      const commission = itemTotal * 0.02;
      platformCommission += commission;
      sellerEarnings += itemTotal - commission;

      // Group items by seller
      const sellerId = product.user.toString();
      if (!sellerItems[sellerId]) {
        sellerItems[sellerId] = {
          sellerId,
          items: [],
          subtotal: 0,
          commission: 0,
          sellerEarnings: 0
        };
      }

      const orderItem = {
        product: product._id,
        quantity: item.quantity,
        price: item.price,
        purchasePrice: product.purchasePrice || 0,
        name: product.name,
        image: product.image,
        seller: product.user
      };

      processedItems.push(orderItem);

      sellerItems[sellerId].items.push({
        productId: product._id,
        quantity: item.quantity,
        price: item.price
      });
      sellerItems[sellerId].subtotal += itemTotal;
      sellerItems[sellerId].commission += commission;
      sellerItems[sellerId].sellerEarnings += itemTotal - commission;
    }

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: processedItems,
      subtotal,
      discount,
      vat,
      shippingCost,
      totalPrice,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      deliveryOption: deliveryOption || 'standard',
      deliveryInstructions,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'pending' : 'paid',
      isPaid: paymentMethod !== 'Cash on Delivery',
      paidAt: paymentMethod !== 'Cash on Delivery' ? new Date() : null,
      platformCommission,
      sellerEarnings,
      sellers: Object.values(sellerItems),
      statusHistory: [{
        status: 'pending',
        date: new Date(),
        note: 'Order placed successfully'
      }]
    });

    // Deduct stock for each item
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        product.soldCount = (product.soldCount || 0) + item.quantity;
        await product.save();
      }
    }

    // Clear user cart
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();

    // Create transaction record for paid orders
    if (paymentMethod !== 'Cash on Delivery') {
      await Transaction.create({
        type: 'Cash In',
        amount: totalPrice,
        description: `Payment for order ${order.orderNumber}`,
        category: 'sales',
        reference: order._id,
        referenceModel: 'Order',
        paymentMethod,
        user: req.user.id,
        date: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    let query = { user: req.user.id };
    if (status) query.status = status;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('items.product', 'name image sellingPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments(query);

    // Get order statistics
    const stats = await Order.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' }
        }
      }
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
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phoneNumber')
      .populate('items.product', 'name image sellingPrice description')
      .populate('items.seller', 'name shopName phoneNumber');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is ${order.status}`
      });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.soldCount -= item.quantity;
        await product.save();
      }
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellationReason = req.body.reason || 'Cancelled by customer';
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: 'cancelled',
      date: new Date(),
      note: req.body.reason || 'Order cancelled by customer',
      updatedBy: req.user.id
    });

    await order.save();

    // Create refund transaction if paid
    if (order.isPaid) {
      await Transaction.create({
        type: 'Cash Out',
        amount: order.totalPrice,
        description: `Refund for cancelled order ${order.orderNumber}`,
        category: 'refunds',
        reference: order._id,
        referenceModel: 'Order',
        paymentMethod: order.paymentMethod,
        user: req.user.id,
        date: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
};

// @desc    Track order
// @route   GET /api/orders/track/:orderNumber
// @access  Public
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .select('orderNumber status statusHistory trackingNumber courier estimatedDeliveryDate actualDeliveryDate')
      .populate('items.product', 'name image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      tracking: order
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track order'
    });
  }
};

// @desc    Update order status (Admin/Seller)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Seller
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, courier, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check seller authorization (if seller, only update orders containing their products)
    if (req.user.role === 'seller') {
      const hasSellerItems = order.sellers.some(
        s => s.sellerId.toString() === req.user.id
      );

      if (!hasSellerItems) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this order'
        });
      }
    }

    // Update fields
    if (status) {
      order.status = status;

      // If delivered, set actual delivery date
      if (status === 'delivered') {
        order.actualDeliveryDate = new Date();
      }
    }

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier) order.courier = courier;

    // Add to status history
    order.statusHistory.push({
      status: status || order.status,
      date: new Date(),
      note: note || `Status updated by ${req.user.role}`,
      updatedBy: req.user.id
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller
// @access  Private/Seller
exports.getSellerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    // Find orders that contain seller's products
    const query = {
      'sellers.sellerId': req.user.id
    };

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

    // Calculate seller-specific earnings
    const ordersWithSellerData = orders.map(order => {
      const sellerInfo = order.sellers.find(
        s => s.sellerId.toString() === req.user.id
      );

      return {
        ...order.toObject(),
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
      message: 'Failed to fetch seller orders'
    });
  }
};
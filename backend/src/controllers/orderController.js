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
    console.log('📦 Create order request received');
    
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
      discount = 0,
      vat = 0,
      shippingCost = 0,
      totalPrice,
      shippingAddress,
      paymentMethod
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }

    const processedItems = [];
    let calculatedSubtotal = 0;
    let platformCommission = 0;
    let sellerEarnings = 0;
    const sellersMap = new Map();

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found`
        });
      }

      const quantity = Number(item.quantity) || 1;
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const itemPrice = Number(item.price) || product.sellingPrice;
      const itemTotal = itemPrice * quantity;
      calculatedSubtotal += itemTotal;

      const commission = itemTotal * 0.02;
      platformCommission += commission;
      const sellerEarning = itemTotal - commission;
      sellerEarnings += sellerEarning;

      processedItems.push({
        product: product._id,
        quantity: quantity,
        price: itemPrice,
        purchasePrice: product.purchasePrice || 0,
        name: product.name,
        image: product.image,
        seller: product.user
      });

      const sellerId = product.user.toString();
      if (!sellersMap.has(sellerId)) {
        sellersMap.set(sellerId, {
          sellerId: product.user,
          items: [],
          subtotal: 0,
          commission: 0,
          sellerEarnings: 0
        });
      }
      
      const sellerData = sellersMap.get(sellerId);
      sellerData.items.push({
        productId: product._id,
        quantity: quantity,
        price: itemPrice
      });
      sellerData.subtotal += itemTotal;
      sellerData.commission += commission;
      sellerData.sellerEarnings += sellerEarning;
    }

    const expectedTotal = calculatedSubtotal + Number(shippingCost) + Number(vat) - Number(discount);

    const orderData = {
      user: req.user.id,
      items: processedItems,
      subtotal: calculatedSubtotal,
      discount: Number(discount) || 0,
      vat: Number(vat) || 0,
      shippingCost: Number(shippingCost) || 0,
      totalPrice: expectedTotal,
      shippingAddress: {
        fullName: shippingAddress.fullName || req.user.name,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postalCode || '',
        country: 'Bangladesh',
        phoneNumber: shippingAddress.phoneNumber || req.user.phoneNumber
      },
      billingAddress: shippingAddress,
      paymentMethod,
      deliveryOption: 'standard',
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'pending' : 'paid',
      isPaid: paymentMethod !== 'Cash on Delivery',
      paidAt: paymentMethod !== 'Cash on Delivery' ? new Date() : null,
      platformCommission,
      sellerEarnings,
      sellers: Array.from(sellersMap.values()),
      statusHistory: [{
        status: 'pending',
        date: new Date(),
        note: 'Order placed successfully'
      }]
    };

    const order = new Order(orderData);
    await order.save();

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= Number(item.quantity) || 1;
        product.soldCount = (product.soldCount || 0) + (Number(item.quantity) || 1);
        await product.save();
      }
    }

    const user = await User.findById(req.user.id);
    if (user) {
      user.cart = [];
      await user.save();
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name image price');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });

  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order. Please try again.'
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { user: req.user.id };
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('items.product', 'name image sellingPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
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
      .populate('items.product', 'name image sellingPrice description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user._id.toString() !== req.user.id && 
        req.user.role !== 'admin' && 
        req.user.role !== 'seller') {
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

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is ${order.status}`
      });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.soldCount = Math.max(0, (product.soldCount || 0) - item.quantity);
        await product.save();
      }
    }

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

    res.status(200).json({
      success: true,
      orders,
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
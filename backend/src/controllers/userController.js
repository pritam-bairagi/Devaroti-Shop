const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { validationResult } = require('express-validator');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires')
      .populate({
        path: 'cart.product',
        select: 'name price sellingPrice image stock category sellingPrice'
      })
      .populate({
        path: 'favorites',
        select: 'name price sellingPrice image stock category sellingPrice'
      });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get user statistics
    const [orderStats, reviewStats] = await Promise.all([
      Order.aggregate([
        { $match: { user: user._id } },
        { $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalPrice' },
            pendingOrders: { 
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            }
          }}
      ]),
      
      Review.countDocuments({ userId: user._id })
    ]);

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalOrders: orderStats[0]?.totalOrders || 0,
        totalSpent: orderStats[0]?.totalSpent || 0,
        pendingOrders: orderStats[0]?.pendingOrders || 0,
        deliveredOrders: orderStats[0]?.deliveredOrders || 0,
        totalReviews: reviewStats
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update allowed fields
    const updateFields = [
      'name', 'phoneNumber', 'address', 'location', 
      'bio', 'profilePic', 'shopName', 'shopDescription',
      'paymentMethod', 'paymentDetails'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Check email uniqueness if being updated
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use' 
        });
      }
      user.email = req.body.email;
      user.isEmailVerified = false; // Require re-verification
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires')
      .populate('cart.product')
      .populate('favorites');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
};

// @desc    Add to cart
// @route   POST /api/users/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }

    // Check if product exists and is available
    const product = await Product.findOne({ 
      _id: productId, 
      liveStatus: 'live' 
    });

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found or unavailable' 
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${product.stock} units available` 
      });
    }

    const user = await User.findById(req.user.id);

    // Check if product already in cart
    const cartItemIndex = user.cart.findIndex(
      item => item.product && item.product.toString() === productId
    );

    if (cartItemIndex > -1) {
      // Update quantity
      const newQuantity = user.cart[cartItemIndex].quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot add more than ${product.stock} units` 
        });
      }
      
      user.cart[cartItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      user.cart.push({ product: productId, quantity });
    }

    await user.save();

    // Populate cart items
    await user.populate({
      path: 'cart.product',
      select: 'name price sellingPrice image stock category sellingPrice'
    });

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart: user.cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add to cart' 
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/users/cart/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid quantity is required' 
      });
    }

    const user = await User.findById(req.user.id);

    const cartItem = user.cart.find(
      item => item.product && item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found in cart' 
      });
    }

    // Check stock
    const product = await Product.findById(productId);
    if (product && product.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${product.stock} units available` 
      });
    }

    cartItem.quantity = quantity;
    await user.save();

    await user.populate({
      path: 'cart.product',
      select: 'name price sellingPrice image stock category'
    });

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: user.cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update cart' 
    });
  }
};

// @desc    Remove from cart
// @route   DELETE /api/users/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);

    user.cart = user.cart.filter(
      item => item.product && item.product.toString() !== productId
    );

    await user.save();

    await user.populate({
      path: 'cart.product',
      select: 'name price sellingPrice image stock category'
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: user.cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove from cart' 
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/users/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.cart = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart: []
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear cart' 
    });
  }
};

// @desc    Toggle favorite
// @route   POST /api/users/favorites/:productId
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const user = await User.findById(req.user.id);

    const index = user.favorites.indexOf(productId);

    if (index > -1) {
      user.favorites.splice(index, 1);
      var message = 'Removed from favorites';
    } else {
      user.favorites.push(productId);
      var message = 'Added to favorites';
    }

    await user.save();

    await user.populate('favorites', 'name price sellingPrice image stock category');

    res.status(200).json({
      success: true,
      message,
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update favorites' 
    });
  }
};

// @desc    Get favorites
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favorites', 'name price sellingPrice image stock category sellingPrice');

    res.status(200).json({
      success: true,
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch favorites' 
    });
  }
};

// @desc    Add shipping address
// @route   POST /api/users/address
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address is required' 
      });
    }

    const user = await User.findById(req.user.id);
    
    user.address = address;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address added successfully',
      address: user.address
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add address' 
    });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp -otpExpire -resetPasswordToken -resetPasswordExpires')
      .populate('cart.product')
      .populate('favorites');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get user statistics
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      { $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' }
        }}
    ]);

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalOrders: orderStats[0]?.totalOrders || 0,
        totalSpent: orderStats[0]?.totalSpent || 0
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user' 
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user has pending orders
    const pendingOrders = await Order.findOne({
      user: user._id,
      status: { $in: ['pending', 'confirmed', 'processing'] }
    });

    if (pendingOrders) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete account with pending orders' 
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete account' 
    });
  }
};
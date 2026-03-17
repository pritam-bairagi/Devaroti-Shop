// models/User.js - Complete Fixed Version
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ==================== CONSTANTS ====================
const USER_ROLES = ['user', 'admin', 'seller', 'courier'];
const PAYMENT_METHODS = ['bkash', 'nagad', 'bank', 'rocket'];
const USER_LEVELS = ['Plastic', 'Bronze', 'Silver', 'Gold', 'Platinum', 'VIP'];

const LEVEL_CONFIG = {
  Plastic: { color: '#ff5500', minSpent: 0, maxSpent: 4999 },
  Bronze: { color: '#CD7F32', minSpent: 5000, maxSpent: 9999 },
  Silver: { color: '#C0C0C0', minSpent: 10000, maxSpent: 49999 },
  Gold: { color: '#FFD700', minSpent: 50000, maxSpent: 99999 },
  Platinum: { color: '#E5E4E2', minSpent: 100000, maxSpent: 499999 },
  VIP: { color: '#8B4513', minSpent: 500000, maxSpent: Infinity }
};

// ==================== VALIDATION FUNCTIONS ====================
const validateEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const validatePhoneNumber = (phone) => {
  const re = /^01[3-9]\d{8}$/;
  return re.test(phone);
};

const validatePostalCode = (code) => {
  const re = /^\d{4}$/;
  return re.test(code);
};

// ==================== SCHEMA DEFINITION ====================
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validateEmail,
      message: 'Please add a valid email'
    }
  },
  
  phoneNumber: {
    type: String,
    required: [true, 'Please add a phone number'],
    unique: true,
    sparse: true,
    validate: {
      validator: validatePhoneNumber,
      message: 'Please add a valid Bangladesh phone number (01XXXXXXXXX)'
    }
  },
  
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  role: {
    type: String,
    enum: USER_ROLES,
    default: 'user'
  },
  
  profilePic: { 
    type: String, 
    default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' 
  },
  
  bio: { 
    type: String,
    maxlength: [200, 'Bio cannot be more than 200 characters']
  },
  
  location: { 
    type: String,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },

  level: {
    type: String,
    enum: USER_LEVELS,
    default: 'Plastic'
  },
  
  levelColor: {
    type: String,
    default: '#ff5500'
  },
  
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent cannot be negative']
  },
  
  orderCount: {
    type: Number,
    default: 0,
    min: [0, 'Order count cannot be negative']
  },

  addresses: [{
    label: { 
      type: String, 
      default: 'Home',
      enum: ['Home', 'Office', 'Other']
    },
    name: { 
      type: String, 
      required: true 
    },
    phone: { 
      type: String, 
      required: true,
      validate: {
        validator: validatePhoneNumber,
        message: 'Invalid phone number'
      }
    },
    addressLine1: { 
      type: String, 
      required: true 
    },
    addressLine2: String,
    city: { 
      type: String, 
      required: true 
    },
    state: String,
    postalCode: { 
      type: String, 
      required: true,
      validate: {
        validator: validatePostalCode,
        message: 'Postal code must be 4 digits'
      }
    },
    country: { 
      type: String, 
      default: 'Bangladesh' 
    },
    isDefault: { 
      type: Boolean, 
      default: false 
    }
  }],

  shopName: { 
    type: String,
    trim: true
  },
  
  shopLogo: {
    type: String,
    default: ''
  },
  
  shopBanner: {
    type: String,
    default: ''
  },
  
  shopDescription: {
    type: String,
    maxlength: [500, 'Shop description cannot be more than 500 characters']
  },
  
  shopLocation: {
    type: String
  },
  
  businessLicense: {
    type: String
  },

  paymentMethod: { 
    type: String,
    enum: PAYMENT_METHODS
  },
  
  paymentDetails: {
    type: String
  },

  cashBox: { 
    type: Number, 
    default: 0,
    min: [0, 'Cash box cannot be negative']
  },
  
  totalEarnings: {
    type: Number,
    default: 0,
    min: [0, 'Total earnings cannot be negative']
  },
  
  pendingWithdrawals: {
    type: Number,
    default: 0,
    min: [0, 'Pending withdrawals cannot be negative']
  },

  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        default: 1,
        min: [1, 'Quantity must be at least 1'],
        max: [100, 'Quantity cannot exceed 100']
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  ],

  isVerified: {
    type: Boolean,
    default: false
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  isSellerApproved: {
    type: Boolean,
    default: false
  },

  otp: {
    type: String,
    select: false
  },
  
  otpExpire: {
    type: Date,
    select: false
  },
  
  resetPasswordToken: {
    type: String,
    select: false
  },
  
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  
  reactivationToken: {
    type: String,
    select: false
  },
  
  reactivationExpires: {
    type: Date,
    select: false
  },

  lastLogin: {
    type: Date
  },
  
  loginCount: {
    type: Number,
    default: 0,
    min: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },
  
  deactivatedAt: Date,

  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'cart.product': 1 });
userSchema.index({ level: 1 });
userSchema.index({ totalSpent: -1 });
userSchema.index({ createdAt: -1 });

// ==================== VIRTUAL PROPERTIES ====================
userSchema.virtual('nextLevel').get(function() {
  const levels = Object.keys(LEVEL_CONFIG);
  const currentIndex = levels.indexOf(this.level);
  
  if (currentIndex < levels.length - 1) {
    return levels[currentIndex + 1];
  }
  return null;
});

userSchema.virtual('nextLevelSpentNeeded').get(function() {
  const nextLevel = this.nextLevel;
  if (!nextLevel) return 0;
  
  const nextMinSpent = LEVEL_CONFIG[nextLevel].minSpent;
  return Math.max(0, nextMinSpent - (this.totalSpent || 0));
});

userSchema.virtual('levelProgress').get(function() {
  const nextLevel = this.nextLevel;
  if (!nextLevel) return 100;
  
  const currentMin = LEVEL_CONFIG[this.level].minSpent;
  const nextMin = LEVEL_CONFIG[nextLevel].minSpent;
  const progress = ((this.totalSpent - currentMin) / (nextMin - currentMin)) * 100;
  
  return Math.min(100, Math.max(0, progress));
});

// ==================== MIDDLEWARE ====================
userSchema.pre('save', async function(next) {
  // Update level
  this.updateLevel();
  
  // Only hash password if modified
  if (!this.isModified('password')) {
    this.updatedAt = Date.now();
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', function(next) {
  // Ensure only one default address
  if (this.addresses && this.addresses.length > 0) {
    const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
    
    if (defaultAddresses.length > 1) {
      let firstDefaultFound = false;
      this.addresses.forEach(addr => {
        if (addr.isDefault && !firstDefaultFound) {
          firstDefaultFound = true;
        } else if (addr.isDefault) {
          addr.isDefault = false;
        }
      });
    }
    
    if (!this.addresses.some(addr => addr.isDefault)) {
      this.addresses[0].isDefault = true;
    }
  }
  next();
});

// ==================== INSTANCE METHODS ====================
userSchema.methods.updateLevel = function() {
  const spent = this.totalSpent || 0;
  
  if (spent >= LEVEL_CONFIG.VIP.minSpent) {
    this.level = 'VIP';
    this.levelColor = LEVEL_CONFIG.VIP.color;
  } else if (spent >= LEVEL_CONFIG.Platinum.minSpent) {
    this.level = 'Platinum';
    this.levelColor = LEVEL_CONFIG.Platinum.color;
  } else if (spent >= LEVEL_CONFIG.Gold.minSpent) {
    this.level = 'Gold';
    this.levelColor = LEVEL_CONFIG.Gold.color;
  } else if (spent >= LEVEL_CONFIG.Silver.minSpent) {
    this.level = 'Silver';
    this.levelColor = LEVEL_CONFIG.Silver.color;
  } else if (spent >= LEVEL_CONFIG.Bronze.minSpent) {
    this.level = 'Bronze';
    this.levelColor = LEVEL_CONFIG.Bronze.color;
  } else {
    this.level = 'Plastic';
    this.levelColor = LEVEL_CONFIG.Plastic.color;
  }
  
  return this.level;
};

userSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    return false;
  }
};

userSchema.methods.generateResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.otp = otp;
  this.otpExpire = Date.now() + 10 * 60 * 1000;
  
  return otp;
};

userSchema.methods.verifyOTP = function(enteredOTP) {
  return this.otp === enteredOTP && this.otpExpire > Date.now();
};

userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  this.loginCount += 1;
  return this.save();
};

userSchema.methods.addToCart = function(productId, quantity = 1) {
  const existingItem = this.cart.find(item => 
    item.product.toString() === productId.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.cart.push({ product: productId, quantity });
  }
  
  return this.save();
};

userSchema.methods.removeFromCart = function(productId) {
  this.cart = this.cart.filter(item => 
    item.product.toString() !== productId.toString()
  );
  return this.save();
};

userSchema.methods.clearCart = function() {
  this.cart = [];
  return this.save();
};

userSchema.methods.addToFavorites = function(productId) {
  if (!this.favorites.includes(productId)) {
    this.favorites.push(productId);
  }
  return this.save();
};

userSchema.methods.removeFromFavorites = function(productId) {
  this.favorites = this.favorites.filter(id => 
    id.toString() !== productId.toString()
  );
  return this.save();
};

userSchema.methods.addAddress = function(addressData) {
  if (addressData.isDefault || this.addresses.length === 0) {
    this.addresses.forEach(addr => { addr.isDefault = false; });
    addressData.isDefault = true;
  }
  
  this.addresses.push(addressData);
  return this.save();
};

userSchema.methods.updateAddress = function(addressId, addressData) {
  const index = this.addresses.findIndex(addr => addr._id.toString() === addressId.toString());
  
  if (index === -1) {
    throw new Error('Address not found');
  }
  
  if (addressData.isDefault) {
    this.addresses.forEach(addr => { addr.isDefault = false; });
  }
  
  addressData._id = this.addresses[index]._id;
  this.addresses[index] = addressData;
  
  return this.save();
};

userSchema.methods.deleteAddress = function(addressId) {
  const wasDefault = this.addresses.find(addr => 
    addr._id.toString() === addressId.toString() && addr.isDefault
  );
  
  this.addresses = this.addresses.filter(addr => addr._id.toString() !== addressId.toString());
  
  if (wasDefault && this.addresses.length > 0) {
    this.addresses[0].isDefault = true;
  }
  
  return this.save();
};

userSchema.methods.getDefaultAddress = function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0] || null;
};

userSchema.methods.deactivateAccount = function() {
  this.isActive = false;
  this.deactivatedAt = Date.now();
  
  const reactivationToken = crypto.randomBytes(32).toString('hex');
  this.reactivationToken = crypto
    .createHash('sha256')
    .update(reactivationToken)
    .digest('hex');
  this.reactivationExpires = Date.now() + 30 * 24 * 60 * 60 * 1000;
  
  return { reactivationToken };
};

userSchema.methods.reactivateAccount = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  if (this.reactivationToken !== hashedToken || this.reactivationExpires < Date.now()) {
    throw new Error('Invalid or expired reactivation token');
  }
  
  this.isActive = true;
  this.deactivatedAt = undefined;
  this.reactivationToken = undefined;
  this.reactivationExpires = undefined;
  
  return this.save();
};

// ==================== STATIC METHODS ====================
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

userSchema.statics.findByPhoneWithPassword = function(phone) {
  return this.findOne({ phoneNumber: phone }).select('+password');
};

userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

userSchema.statics.findByRole = function(role, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ role })
    .skip(skip)
    .limit(limit)
    .sort('-createdAt');
};

userSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
        sellers: { $sum: { $cond: [{ $eq: ['$role', 'seller'] }, 1, 0] } },
        averageSpent: { $avg: '$totalSpent' },
        totalRevenue: { $sum: '$totalSpent' }
      }
    },
    {
      $project: {
        _id: 0,
        totalUsers: 1,
        activeUsers: 1,
        verifiedUsers: 1,
        sellers: 1,
        averageSpent: { $round: ['$averageSpent', 2] },
        totalRevenue: 1
      }
    }
  ]);
  
  return stats[0] || {
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    sellers: 0,
    averageSpent: 0,
    totalRevenue: 0
  };
};

module.exports = mongoose.model('User', userSchema);
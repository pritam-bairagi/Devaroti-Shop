const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    purchasePrice: {
      type: Number,
      default: 0
    },
    name: String,
    image: String,
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  vat: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },

  shippingAddress: {
    fullName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'Bangladesh' },
    phoneNumber: String
  },
  billingAddress: {
    fullName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'Bangladesh' },
    phoneNumber: String
  },

  deliveryOption: {
    type: String,
    enum: ['standard', 'express', 'same-day'],
    default: 'standard'
  },
  deliveryInstructions: String,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,

  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'bkash', 'nagad', 'rocket', 'bank', 'card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    reference: String
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,

  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'processing', 'shipped',
      'out-for-delivery', 'delivered', 'cancelled', 'returned', 'refunded'
    ],
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  trackingNumber: String,
  courier: String,
  courierDetails: {
    type: Map,
    of: String
  },

  orderNotes: String,
  adminNotes: String,

  cancellationReason: String,
  cancelledAt: Date,
  returnedAt: Date,
  refundAmount: Number,
  refundedAt: Date,

  platformCommission: {
    type: Number,
    default: 0
  },
  sellerEarnings: {
    type: Number,
    default: 0
  },

  sellers: [{
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    items: [{
      productId: mongoose.Schema.Types.ObjectId,
      quantity: Number,
      price: Number
    }],
    subtotal: Number,
    commission: Number,
    sellerEarnings: Number,
    status: String
  }],

  invoiceUrl: String,
  invoiceNumber: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1 });
orderSchema.index({ orderNumber: 1 });

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  
  // Update isPaid based on paymentStatus
  this.isPaid = this.paymentStatus === 'paid';
  
  next();
});

// Virtual for order summary
orderSchema.virtual('summary').get(function() {
  return {
    orderNumber: this.orderNumber,
    totalItems: this.items.reduce((acc, item) => acc + item.quantity, 0),
    totalPrice: this.totalPrice,
    status: this.status,
    paymentStatus: this.paymentStatus
  };
});

module.exports = mongoose.model('Order', orderSchema);
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    unique: true
  },
  
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  
  unitPrice: {
    type: Number,
    required: true
  },
  
  totalAmount: {
    type: Number,
    required: true
  },
  
  purchasePrice: {
    type: Number,
    required: true
  },
  
  profit: {
    type: Number,
    required: true
  },
  
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'bkash', 'nagad', 'rocket', 'bank', 'due', 'bKash', 'Nagad', 'Rocket', 'Bank'],
    default: 'Cash'
  },
  
  status: {
    type: String,
    enum: ['ordered', 'pending', 'delivered', 'cancelled', 'returned'],
    default: 'delivered',
    index: true
  },
  
  customerName: {
    type: String
  },
  
  customerPhone: {
    type: String
  },
  
  customerEmail: {
    type: String
  },
  
  notes: {
    type: String
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // For invoice
  invoiceNumber: String,
  
  // For tracking
  saleDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
saleSchema.index({ saleDate: -1 });
saleSchema.index({ product: 1, saleDate: -1 });

// Generate sale number BEFORE validation
saleSchema.pre('validate', function(next) {
  if (!this.saleNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.saleNumber = `SALE-${year}${month}${day}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
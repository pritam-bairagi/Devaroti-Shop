const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  supplier: {
    name: String,
    phone: String,
    email: String,
    address: String
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
  
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'pending'],
    default: 'pending'
  },
  
  paidAmount: {
    type: Number,
    default: 0
  },
  
  dueAmount: {
    type: Number,
    default: 0
  },
  
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank', 'bkash', 'nagad', 'rocket']
  },
  
  notes: {
    type: String
  },
  
  invoiceNumber: String,
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  purchaseDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ product: 1, purchaseDate: -1 });

// Generate purchase number
purchaseSchema.pre('validate', function(next) {
  if (!this.purchaseNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    this.purchaseNumber = `PUR-${year}${month}-${random}`;
  }
  
  this.dueAmount = this.totalAmount - this.paidAmount;
  
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);
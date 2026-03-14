const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  
  // Pricing
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Price cannot be negative']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  price: { // Alias for backward compatibility
    type: Number,
    required: true
  },
  mrp: {
    type: Number,
    min: [0, 'MRP cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Inventory
  unit: {
    type: String,
    default: 'পিস',
    enum: ['পিস', 'কেজি', 'লিটার', 'ডজন', 'হালি', 'প্যাকেট', 'মিলিলিটার', 'পিয়ার', 'গ্রাম']
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  barcode: {
    type: String
  },
  
  // Media
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
  images: [{
    type: String
  }],
  video: {
    type: String
  },
  
  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    index: true
  },
  subcategory: {
    type: String
  },
  brand: {
    type: String
  },
  tags: [{
    type: String
  }],
  
  // Status
  liveStatus: {
    type: String,
    enum: ['live', 'issue', 'not-available', 'draft', 'archived'],
    default: 'live',
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  
  // Specifications
  specifications: {
    type: Map,
    of: String
  },
  weight: {
    type: Number
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'cm' }
  },
  
  // Seller information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Ratings and reviews
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // SEO
  metaTitle: {
    type: String
  },
  metaDescription: {
    type: String
  },
  metaKeywords: [String],
  
  // Sales tracking
  soldCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ sellingPrice: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });

// Create slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    // Support basic Bengali block \u0980-\u09FF plus english
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
      
    if (!baseSlug) baseSlug = 'p';
    
    // Ensure uniqueness by appending timestamp if it's new
    if (this.isNew || !this.slug) {
      this.slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
    }
  }
  
  // Set price alias
  this.price = this.sellingPrice;
  
  // Calculate discount if mrp exists
  if (this.mrp && this.mrp > 0 && this.sellingPrice < this.mrp) {
    this.discount = Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
  }
  
  next();
});

// Virtual for inStock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.purchasePrice > 0) {
    return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100;
  }
  return 0;
});

// Virtual for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId'
});

module.exports = mongoose.model('Product', productSchema);
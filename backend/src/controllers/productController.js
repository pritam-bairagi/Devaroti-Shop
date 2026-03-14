const Product = require('../models/Product');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      minPrice, 
      maxPrice, 
      sort, 
      page = 1, 
      limit = 20,
      inStock,
      brand,
      rating,
      seller
    } = req.query;

    // Build query
    let query = { liveStatus: 'live' };

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      const categories = typeof category === 'string' ? category.split(',') : category;
      query.category = { $in: categories };
    }

    // Price range
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice);
    }

    // Stock filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Brand filter
    if (brand) {
      const brands = typeof brand === 'string' ? brand.split(',') : brand;
      query.brand = { $in: brands };
    }

    // Rating filter
    if (rating) {
      query.averageRating = { $gte: parseFloat(rating) };
    }

    // Seller filter
    if (seller) {
      query.user = seller;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOption = { sellingPrice: 1 };
          break;
        case 'price-desc':
          sortOption = { sellingPrice: -1 };
          break;
        case 'rating':
          sortOption = { averageRating: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'bestselling':
          sortOption = { soldCount: -1 };
          break;
        case 'discount':
          sortOption = { discount: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    // Execute query
    const products = await Product.find(query)
      .populate('user', 'name shopName profilePic')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
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
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products' 
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('user', 'name shopName profilePic shopLocation phoneNumber')
      .populate({
        path: 'reviews',
        match: { approved: true },
        populate: {
          path: 'userId',
          select: 'name profilePic'
        },
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Increment view count
    product.views = (product.views || 0) + 1;
    await product.save();

    // Get related products (same category)
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      liveStatus: 'live'
    })
      .limit(8)
      .populate('user', 'name shopName');

    res.status(200).json({
      success: true,
      product,
      relatedProducts
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch product' 
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin/Seller)
exports.createProduct = async (req, res) => {
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
      name, 
      description, 
      sellingPrice, 
      purchasePrice, 
      unit, 
      category, 
      image, 
      stock,
      images,
      mrp,
      brand,
      specifications,
      shortDescription,
      sku,
      barcode,
      tags
    } = req.body;

    // Check if SKU is unique if provided
    if (sku) {
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product with this SKU already exists' 
        });
      }
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      shortDescription,
      sellingPrice: Number(sellingPrice),
      purchasePrice: Number(purchasePrice),
      price: Number(sellingPrice),
      mrp: mrp ? Number(mrp) : undefined,
      unit: unit || 'পিস',
      category,
      brand,
      image,
      images: images || [image],
      stock: Number(stock) || 0,
      sku: sku || undefined,
      barcode,
      specifications,
      tags,
      user: req.user.id,
      liveStatus: 'live' // Default to live so it's visible immediately
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
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

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check authorization
    if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this product' 
      });
    }

    // Check SKU uniqueness if being updated
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingProduct = await Product.findOne({ 
        sku: req.body.sku,
        _id: { $ne: product._id }
      });
      if (existingProduct) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product with this SKU already exists' 
        });
      }
    }

    // Update fields
    const updateFields = [
      'name', 'description', 'shortDescription', 'sellingPrice', 'purchasePrice',
      'mrp', 'unit', 'category', 'brand', 'image', 'images', 'stock',
      'sku', 'barcode', 'specifications', 'tags', 'liveStatus', 'isFeatured',
      'isNewArrival', 'lowStockThreshold'
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
    console.error('Update product error:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update product' 
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check authorization
    if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this product' 
      });
    }

    // Soft delete - set status to archived
    product.liveStatus = 'archived';
    await product.save();

    // For hard delete (uncomment if needed)
    // await product.remove();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete product' 
    });
  }
};

// @desc    Get seller products
// @route   GET /api/products/seller
// @access  Private (Seller)
exports.getSellerProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = { user: req.user.id };

    if (status) {
      query.liveStatus = status;
    }

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

// @desc    Get product categories
// @route   GET /api/products/categories/all
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { liveStatus: 'live' } },
      { $group: {
          _id: '$category',
          count: { $sum: 1 },
          products: { $push: '$$ROOT' }
        }},
      { $project: {
          _id: 1,
          count: 1,
          image: { $arrayElemAt: ['$products.image', 0] }
        }},
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch categories' 
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      liveStatus: 'live',
      isFeatured: true
    })
      .limit(12)
      .populate('user', 'name shopName');

    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch featured products' 
    });
  }
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private (Admin/Seller)
exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check authorization
    if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    let newStock;
    switch (operation) {
      case 'add':
        newStock = product.stock + quantity;
        break;
      case 'subtract':
        newStock = product.stock - quantity;
        if (newStock < 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Insufficient stock' 
          });
        }
        break;
      case 'set':
        newStock = quantity;
        if (newStock < 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Stock cannot be negative' 
          });
        }
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid operation' 
        });
    }

    product.stock = newStock;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      stock: product.stock
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update stock' 
    });
  }
};

// @desc    Bulk import products
// @route   POST /api/products/bulk
// @access  Private (Admin)
exports.bulkImport = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Products array is required' 
      });
    }

    const createdProducts = [];
    const errors = [];

    for (const productData of products) {
      try {
        const product = await Product.create({
          ...productData,
          user: req.user.id,
          price: productData.sellingPrice
        });
        createdProducts.push(product);
      } catch (error) {
        errors.push({
          product: productData.name,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${createdProducts.length} products`,
      createdProducts,
      errors
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to import products' 
    });
  }
};
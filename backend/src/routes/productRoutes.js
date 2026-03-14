const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { protect, admin, adminOrSeller } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Validation
const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('sellingPrice').isNumeric().withMessage('Valid selling price is required'),
  body('purchasePrice').isNumeric().withMessage('Valid purchase price is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('image').notEmpty().withMessage('Product image is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock is required')
];

// Public routes
router.get('/', productController.getProducts);
router.get('/categories/all', productController.getCategories);
router.get('/featured', productController.getFeaturedProducts);
router.get('/seller', protect, adminOrSeller, productController.getSellerProducts);
router.get('/:id', productController.getProductById);

// Protected routes
router.post('/', protect, adminOrSeller, upload.single('image'), productValidation, productController.createProduct);
router.put('/:id', protect, adminOrSeller, upload.single('image'), productController.updateProduct);
router.delete('/:id', protect, adminOrSeller, productController.deleteProduct);
router.put('/:id/stock', protect, adminOrSeller, productController.updateStock);

// Admin only
router.post('/bulk', protect, admin, productController.bulkImport);

module.exports = router;
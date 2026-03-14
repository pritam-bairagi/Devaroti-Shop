const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import seeders
const seedAdmin = require('./src/utils/seeder');
const seedProducts = require('./src/utils/productSeeder');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const sellerRoutes = require('./src/routes/sellerRoutes');

// Import error middleware
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'E-Commerce API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      admin: '/api/admin',
      seller: '/api/seller'
    }
  });
});

// Error middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = Number(process.env.PORT) || 5000;

mongoose.connection.once('open', async () => {
  console.log('✅ MongoDB Connected');

  // Seed data if needed
  if (process.env.NODE_ENV === 'development') {
    await seedAdmin();
    await seedProducts();
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔍 Test: Server is active and listening`);
  });
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});
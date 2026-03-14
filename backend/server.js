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

// ==================== DATABASE CONNECTION ====================
// Connect to MongoDB with better error handling
const startServer = async () => {
  try {
    await connectDB();
    
    // ==================== MIDDLEWARE ====================
    // CORS configuration
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parser middleware
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Static folder for uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    app.use('/uploads', express.static(uploadsDir));

    // ==================== REQUEST LOGGING ====================
    app.use((req, res, next) => {
      console.log(`\n📨 ${new Date().toISOString()}`);
      console.log(`${req.method} ${req.originalUrl}`);
      console.log('Headers:', {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Bearer [PRESENT]' : 'None'
      });
      if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Body:', JSON.stringify(req.body, null, 2).substring(0, 500));
      }
      next();
    });

    // ==================== ROUTES ====================
    // API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);

    // Test route
    app.get('/api/test', (req, res) => {
      res.json({ 
        success: true, 
        message: 'API is working',
        timestamp: new Date().toISOString()
      });
    });

    // ==================== HOME ROUTE ====================
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '🚀 Parash Feri E-Commerce API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        endpoints: {
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            verify: 'POST /api/auth/verify',
            me: 'GET /api/auth/me'
          },
          users: {
            profile: 'GET /api/users/profile',
            cart: 'POST /api/users/cart',
            favorites: 'GET /api/users/favorites'
          },
          products: {
            list: 'GET /api/products',
            single: 'GET /api/products/:id',
            create: 'POST /api/products',
            categories: 'GET /api/products/categories/all'
          },
          orders: {
            create: 'POST /api/orders',
            myOrders: 'GET /api/orders/my-orders',
            track: 'GET /api/orders/track/:orderNumber'
          },
          admin: {
            stats: 'GET /api/admin/stats',
            users: 'GET /api/admin/users',
            orders: 'GET /api/admin/orders'
          },
          seller: {
            stats: 'GET /api/seller/stats',
            products: 'GET /api/seller/products',
            orders: 'GET /api/seller/orders'
          }
        }
      });
    });

    // ==================== HEALTH CHECK ====================
    app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: '✅ Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: {
          state: mongoose.connection.readyState,
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          name: mongoose.connection.name,
          host: mongoose.connection.host
        }
      });
    });

    // ==================== ERROR HANDLING ====================
    // 404 handler
    app.use(notFound);

    // Global error handler
    app.use(errorHandler);

    // ==================== START SERVER ====================
    const PORT = Number(process.env.PORT) || 5000;

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Database: ${mongoose.connection.name} (${mongoose.connection.host})`);
      console.log('='.repeat(50) + '\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// ==================== UNHANDLED ERRORS ====================
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error(err.stack);
  // Don't exit immediately in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  console.error(err.stack);
  // Don't exit immediately in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Closing server...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Closing server...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;
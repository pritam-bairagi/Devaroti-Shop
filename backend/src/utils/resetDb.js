const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');

const seedAdmin = require('./seeder');
const seedProducts = require('./productSeeder');

const resetDb = async () => {
  try {
    console.log('Dropping existing collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Sale.deleteMany({});
    await Purchase.deleteMany({});
    await Transaction.deleteMany({});
    await Review.deleteMany({});
    console.log('Old data removed successfully.');

    console.log('Seeding new data...');
    await seedAdmin();
    // Wait for a second before seeding products to make sure admin is fully created
    await new Promise(resolve => setTimeout(resolve, 1000));
    await seedProducts();
    
    console.log('Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

resetDb();

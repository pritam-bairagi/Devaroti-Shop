const Product = require('../models/Product');
const User = require('../models/User');

const sampleProducts = [
  {
    name: "Cartoon Astronaut T-Shirts",
    description: "Pure cotton comfortable summer t-shirt with astronaut print. Perfect for casual wear.",
    shortDescription: "Cotton astronaut print t-shirt",
    sellingPrice: 499,
    purchasePrice: 350,
    mrp: 799,
    unit: "পিস",
    image: "https://i.ibb.co/qpz8v8p/f1.jpg",
    images: ["https://i.ibb.co/qpz8v8p/f1.jpg"],
    category: "Clothing",
    subcategory: "T-Shirts",
    brand: "Fashionista",
    stock: 50,
    lowStockThreshold: 5,
    tags: ["cotton", "summer", "casual", "t-shirt"],
    isFeatured: true,
    isNewArrival: true
  },
  {
    name: "Flower Print Summer Shirt",
    description: "Lightweight breathable shirt perfect for beach days and summer outings.",
    shortDescription: "Lightweight summer shirt",
    sellingPrice: 599,
    purchasePrice: 400,
    mrp: 999,
    unit: "পিস",
    image: "https://i.ibb.co/vY8mXF0/f2.jpg",
    images: ["https://i.ibb.co/vY8mXF0/f2.jpg"],
    category: "Clothing",
    subcategory: "Shirts",
    brand: "Summer Vibes",
    stock: 30,
    lowStockThreshold: 5,
    tags: ["summer", "floral", "shirt", "beach"],
    isFeatured: true
  },
  {
    name: "Vintage Denim Jacket",
    description: "Classic blue denim jacket with sturdy buttons and premium quality denim.",
    shortDescription: "Classic denim jacket",
    sellingPrice: 1299,
    purchasePrice: 900,
    mrp: 1999,
    unit: "পিস",
    image: "https://i.ibb.co/vL0Nn6v/f3.jpg",
    images: ["https://i.ibb.co/vL0Nn6v/f3.jpg"],
    category: "Clothing",
    subcategory: "Jackets",
    brand: "Denim Co",
    stock: 20,
    lowStockThreshold: 3,
    tags: ["denim", "jacket", "vintage", "winter"],
    isFeatured: true
  },
  {
    name: "Wireless Bluetooth Headphones",
    description: "Premium wireless headphones with noise cancellation and 30-hour battery life.",
    shortDescription: "Wireless noise-cancelling headphones",
    sellingPrice: 2499,
    purchasePrice: 1800,
    mrp: 3499,
    unit: "পিস",
    image: "https://i.ibb.co/xL0mGzY/f4.jpg",
    images: ["https://i.ibb.co/xL0mGzY/f4.jpg"],
    category: "Electronics",
    subcategory: "Headphones",
    brand: "SoundMaster",
    stock: 15,
    lowStockThreshold: 3,
    tags: ["headphones", "wireless", "bluetooth", "audio"],
    isFeatured: true
  },
  {
    name: "Smart Watch Fitness Tracker",
    description: "Track your fitness, heart rate, and sleep with this advanced smart watch.",
    shortDescription: "Fitness tracking smart watch",
    sellingPrice: 1899,
    purchasePrice: 1200,
    mrp: 2799,
    unit: "পিস",
    image: "https://i.ibb.co/pL0mGzY/f5.jpg",
    images: ["https://i.ibb.co/pL0mGzY/f5.jpg"],
    category: "Electronics",
    subcategory: "Wearables",
    brand: "TechFit",
    stock: 25,
    lowStockThreshold: 5,
    tags: ["smartwatch", "fitness", "wearable", "health"],
    isFeatured: true
  },
  {
    name: "Leather Minimalist Wallet",
    description: "Slim genuine leather wallet with RFID protection and multiple card slots.",
    shortDescription: "RFID protected leather wallet",
    sellingPrice: 399,
    purchasePrice: 200,
    mrp: 699,
    unit: "পিস",
    image: "https://i.ibb.co/qL0mGzY/f6.jpg",
    images: ["https://i.ibb.co/qL0mGzY/f6.jpg"],
    category: "Accessories",
    subcategory: "Wallets",
    brand: "LeatherCraft",
    stock: 100,
    lowStockThreshold: 10,
    tags: ["wallet", "leather", "accessories", "rfid"],
    isFeatured: false
  },
  {
    name: "Running Sports Shoes",
    description: "Lightweight running shoes with cushioned sole for maximum comfort.",
    shortDescription: "Comfortable running shoes",
    sellingPrice: 1599,
    purchasePrice: 1000,
    mrp: 2299,
    unit: "পিস",
    image: "https://i.ibb.co/rL0mGzY/f7.jpg",
    images: ["https://i.ibb.co/rL0mGzY/f7.jpg"],
    category: "Footwear",
    subcategory: "Sports Shoes",
    brand: "SportX",
    stock: 40,
    lowStockThreshold: 5,
    tags: ["shoes", "running", "sports", "footwear"],
    isFeatured: true
  },
  {
    name: "Stainless Steel Water Bottle",
    description: "Insulated stainless steel bottle keeps drinks cold for 24 hours or hot for 12 hours.",
    shortDescription: "Insulated water bottle",
    sellingPrice: 599,
    purchasePrice: 350,
    mrp: 899,
    unit: "পিস",
    image: "https://i.ibb.co/sL0mGzY/f8.jpg",
    images: ["https://i.ibb.co/sL0mGzY/f8.jpg"],
    category: "Home & Living",
    subcategory: "Kitchen",
    brand: "EcoLife",
    stock: 60,
    lowStockThreshold: 10,
    tags: ["bottle", "water", "stainless", "eco-friendly"],
    isFeatured: false
  }
];

const seedProducts = async () => {
  try {
    // Check if products already exist
    const count = await Product.countDocuments();
    
    if (count === 0) {
      // Get admin user or first user
      let admin = await User.findOne({ role: 'admin' });
      
      if (!admin) {
        // Create a temporary admin if none exists
        admin = await User.findOne();
      }
      
      if (!admin) {
        console.log('No users found. Skipping product seed.');
        return;
      }

      // Add user to products
      const productsWithUser = sampleProducts.map(product => ({
        ...product,
        user: admin._id,
        price: product.sellingPrice
      }));

      await Product.insertMany(productsWithUser);
      console.log(`✅ Seeded ${productsWithUser.length} sample products`);
    } else {
      console.log(`📦 Products already exist (${count} products)`);
    }
  } catch (error) {
    console.error('❌ Product seeding error:', error);
  }
};

module.exports = seedProducts;
// backend/utils/seeder.js
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@parashferi.com';
    
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      // Create admin user
      admin = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: 'Admin@123456',
        phoneNumber: '01700000000',
        role: 'admin',
        isVerified: true,
        isEmailVerified: true,
        isActive: true
      });
      
      console.log('✅ Admin user created successfully');
      console.log('📧 Email: admin@parashferi.com');
      console.log('🔑 Password: Admin@123456');
    } else {
      // Update admin password to ensure it's hashed
      admin.password = 'Admin@123456';
      admin.isVerified = true;
      admin.isEmailVerified = true;
      admin.isActive = true;
      await admin.save();
      
      console.log('✅ Admin user updated successfully');
    }

    // Create a sample seller
    const sellerEmail = 'seller@parashferi.com';
    let seller = await User.findOne({ email: sellerEmail });
    
    if (!seller) {
      seller = await User.create({
        name: 'Sample Seller',
        email: sellerEmail,
        password: 'Seller@123456',
        phoneNumber: '01711111111',
        role: 'seller',
        shopName: 'Sample Store',
        shopDescription: 'We sell quality products at affordable prices',
        shopLocation: 'Dhaka, Bangladesh',
        isVerified: true,
        isEmailVerified: true,
        isSellerApproved: true,
        isActive: true
      });
      
      console.log('✅ Sample seller created successfully');
    } else {
      console.log('📦 Seller already exists');
    }

    // Create a sample user
    const userEmail = 'user@parashferi.com';
    let sampleUser = await User.findOne({ email: userEmail });
    
    if (!sampleUser) {
      sampleUser = await User.create({
        name: 'Sample User',
        email: userEmail,
        password: 'User@123456',
        phoneNumber: '01722222222',
        role: 'user',
        address: '123 Sample Street, Dhaka',
        isVerified: true,
        isEmailVerified: true,
        isActive: true
      });
      
      console.log('✅ Sample user created successfully');
    } else {
      console.log('📦 User already exists');
    }

  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};

module.exports = seedAdmin;
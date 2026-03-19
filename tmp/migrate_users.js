const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

// Absolute path to User model
const User = require(path.join(__dirname, '../backend/src/models/User'));

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found in .env');
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      { level: 'Plastic' },
      { $set: { level: 'Bronze' } }
    );

    console.log(`Updated ${result.modifiedCount} users from Plastic to Bronze`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();

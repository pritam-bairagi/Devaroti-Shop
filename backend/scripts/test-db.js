const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '../.env' });

const testAtlasConnection = async () => {
  try {
    console.log('Testing MongoDB Atlas Connection...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    console.log('Attempting to connect to MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Atlas connection successful!');
    
    // Test write operation
    const db = mongoose.connection.db;
    const testCollection = db.collection('test_connection');
    
    // Insert test document
    const result = await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Connection test'
    });
    console.log('✅ Write operation successful, inserted ID:', result.insertedId);
    
    // Read test document
    const found = await testCollection.findOne({ test: true });
    console.log('✅ Read operation successful, found:', found);
    
    // Delete test document
    await testCollection.deleteMany({ test: true });
    console.log('✅ Delete operation successful');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(col => console.log(` - ${col.name}`));
    
    await mongoose.disconnect();
    console.log('\n✅ All tests passed! MongoDB Atlas is working correctly.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Check if your IP address is whitelisted in MongoDB Atlas');
    console.error('2. Verify username and password in connection string');
    console.error('3. Make sure the database name is correct');
    console.error('4. Check network connectivity');
    console.error('5. Verify cluster is running');
    
    process.exit(1);
  }
};

testAtlasConnection();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/christantus_medical';
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('   Make sure MongoDB is running locally, or that MONGO_URI in .env points to a valid Atlas cluster.');
    process.exit(1);
  }
};

module.exports = connectDB;

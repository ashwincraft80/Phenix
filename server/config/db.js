const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/symbiolink';

  try {
    // Attempt connection with a short 800ms timeout so it doesn't hang if local mongo isn't active
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 800
    });
    isConnected = true;
    console.log(`✅ [MongoDB Connected] Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.log(`ℹ️  [Database Mode: In-Memory / Standalone Fallback]`);
    console.log(`   (No local MongoDB running on ${uri}. Seamlessly using high-performance in-memory repository)`);
    return false;
  }
};

const getDbStatus = () => ({
  isConnected,
  mode: isConnected ? 'MongoDB' : 'In-Memory Store',
  readyState: mongoose.connection.readyState
});

module.exports = {
  connectDB,
  getDbStatus
};

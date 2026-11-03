const mongoose = require('mongoose');
const debug = require('debug')('chor-sipahi:db');

const connectDB = async (uri) => {
  mongoose.set('strictQuery', true);
  while (true) {
    try {
      await mongoose.connect(uri, {
        // Atlas database names are case-sensitive; use the exact database name created in MongoDB.
        dbName: process.env.MONGODB_DB_NAME || 'Chor_Sipahi',
        serverSelectionTimeoutMS: 5000,
      });
      const { name, host } = mongoose.connection;
      console.log(`MongoDB connected: database=${name}, host=${host}`);
      debug('MongoDB connected');
      return;
    } catch (err) {
      console.error('MongoDB connection error:', err.message);
      console.error('Retrying MongoDB connection in 5 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;

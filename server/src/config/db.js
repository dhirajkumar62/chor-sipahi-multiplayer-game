const mongoose = require('mongoose');
const debug = require('debug')('chor-sipahi:db');

const connectDB = async (uri) => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    debug('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // retry
    setTimeout(() => connectDB(uri), 5000);
  }
};

module.exports = connectDB;

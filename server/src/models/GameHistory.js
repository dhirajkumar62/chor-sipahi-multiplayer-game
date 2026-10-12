const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: String,
  result: { type: String },
  points: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GameHistory', historySchema);

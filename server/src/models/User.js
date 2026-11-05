const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, trim: true, default: '' },
  email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
  password: { type: String, default: null },
  googleId: { type: String, default: null },
  profilePicture: { type: String, default: '' },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  points: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.index({ googleId: 1 }, {
  unique: true,
  partialFilterExpression: { googleId: { $type: 'string' } }
});

module.exports = mongoose.model('User', userSchema);

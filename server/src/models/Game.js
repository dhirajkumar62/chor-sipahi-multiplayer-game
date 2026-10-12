const mongoose = require('mongoose');

const playerSubSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  socketId: String,
  role: { type: String },
  points: { type: Number, default: 0 }
});

const gameSchema = new mongoose.Schema({
  gameCode: { type: String, required: true, unique: true, index: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  players: [playerSubSchema],
  status: { type: String, enum: ['waiting', 'started', 'ended'], default: 'waiting' },
  // Roles are stored only on the server. Never serialize this document directly to clients.
  roles: { type: Map, of: String, default: {} },
  guessMade: { type: Boolean, default: false },
  guess: {
    accuserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accusedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    correct: Boolean
  },
  results: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, name: String, role: String, points: Number, result: String, winner: Boolean }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  endedAt: Date,
  settings: {
    raja: { type: Number, default: 1000 },
    sipahiCorrect: { type: Number, default: 500 },
    sipahiIncorrect: { type: Number, default: 0 },
    chorEscapes: { type: Number, default: 300 },
    other: { type: Number, default: 100 },
    maxPlayers: { type: Number, default: 4 },
    guessTimeSec: { type: Number, default: 60 }
  }
});

module.exports = mongoose.model('Game', gameSchema);

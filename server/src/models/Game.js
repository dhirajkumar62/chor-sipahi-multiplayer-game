const mongoose = require('mongoose');

const playerSubSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  socketId: String,
  role: { type: String },
  points: { type: Number, default: 0 }
}, { _id: false });

const gameSchema = new mongoose.Schema({
  gameCode: { type: String, required: true, unique: true, index: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  players: [playerSubSchema],
  status: { type: String, enum: ['waiting', 'started', 'ended', 'rematch_waiting'], default: 'waiting' },
  roundNumber: { type: Number, default: 1 },
  roundId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  roles: { type: Map, of: String, default: {} },
  guessMade: { type: Boolean, default: false },
  guess: {
    accuserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accusedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    correct: Boolean
  },
  mantriGuess: {
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    correct: Boolean,
    submittedAt: Date
  },
  rematchVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  results: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, name: String, role: String, points: Number, result: String, winner: Boolean }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  endedAt: Date,
  settings: {
    raja: { type: Number, default: 1000 },
    mantriCorrect: { type: Number, default: 400 },
    mantriIncorrect: { type: Number, default: 0 },
    sipahiCorrect: { type: Number, default: 500 },
    sipahiIncorrect: { type: Number, default: 0 },
    chorCaught: { type: Number, default: 0 },
    chorEscapes: { type: Number, default: 300 },
    other: { type: Number, default: 100 },
    maxPlayers: { type: Number, default: 4 },
    guessTimeSec: { type: Number, default: 60 }
  }
});

module.exports = mongoose.model('Game', gameSchema);

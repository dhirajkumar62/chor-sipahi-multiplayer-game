const GameHistory = require('../models/GameHistory');
const User = require('../models/User');
const { calculateScores } = require('../utils/gameUtils');

function publicGame(game) {
  return {
    _id: game._id,
    gameCode: game.gameCode,
    hostId: game.hostId,
    status: game.status,
    roundNumber: game.roundNumber,
    roundId: game.roundId,
    players: game.players.map((p) => ({ userId: p.userId, name: p.name, connected: Boolean(p.socketId) })),
    winner: game.winner,
    createdAt: game.createdAt,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    rematchVotes: (game.rematchVotes || []).map((userId) => userId.toString ? userId.toString() : String(userId)),
    settings: { maxPlayers: game.settings.maxPlayers, guessTimeSec: game.settings.guessTimeSec }
  };
}

function resetRoundState(game) {
  game.status = 'waiting';
  game.roundId = new (require('mongoose').Types.ObjectId)().toString();
  game.roundNumber = (game.roundNumber || 1) + 1;
  game.roles = new Map();
  game.guessMade = false;
  game.guess = undefined;
  game.mantriGuess = undefined;
  game.results = [];
  game.winner = undefined;
  game.startedAt = null;
  game.endedAt = null;
  game.rematchVotes = [];
}

function startNewRound(game) {
  resetRoundState(game);
  game.status = 'started';
  game.startedAt = new Date();
  game.endedAt = null;
  game.roles = require('../utils/gameUtils').assignRoles(game.players);
  game.guessMade = false;
  game.guess = undefined;
  game.mantriGuess = undefined;
  game.results = [];
  game.winner = undefined;
  game.rematchVotes = [];
  return game;
}

async function finishGame(game, accusedId = null, accuserId = null, mantriGuessUserId = null) {
  if (game.status === 'ended' || game.status === 'rematch_waiting') return { results: game.results, winnerId: game.winner, alreadyFinished: true };
  const outcome = calculateScores(game, accusedId, mantriGuessUserId);
  const correct = Boolean(accusedId && outcome.playerResults.find((p) => p.userId.toString() === accusedId.toString())?.role === 'CHOR');
  game.status = 'ended';
  game.guessMade = Boolean(accusedId || mantriGuessUserId);
  game.guess = accusedId ? { accuserId, accusedId, correct } : undefined;
  game.mantriGuess = mantriGuessUserId ? { playerId: mantriGuessUserId, submittedBy: accuserId || game.roles && Array.from(game.roles.entries()).find(([, role]) => role === 'MANTRI')?.[0], correct: Boolean(mantriGuessUserId && outcome.playerResults.find((p) => p.userId.toString() === mantriGuessUserId.toString())?.role === 'CHOR'), submittedAt: new Date() } : undefined;
  game.winner = outcome.winnerId;
  game.results = outcome.playerResults;
  game.endedAt = new Date();
  await game.save();

  await Promise.all(outcome.playerResults.map(async (item) => {
    await GameHistory.create({ gameId: game._id, userId: item.userId, role: item.role, result: item.result, points: item.points });
    await User.findByIdAndUpdate(item.userId, { $inc: { points: item.points, gamesPlayed: 1, gamesWon: item.winner ? 1 : 0 } });
  }));

  return outcome;
}

module.exports = { publicGame, finishGame, resetRoundState, startNewRound };

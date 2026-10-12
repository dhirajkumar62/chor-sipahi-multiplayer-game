const GameHistory = require('../models/GameHistory');
const User = require('../models/User');
const { calculateScores } = require('../utils/gameUtils');

function publicGame(game) {
  return {
    _id: game._id, gameCode: game.gameCode, hostId: game.hostId, status: game.status,
    players: game.players.map((p) => ({ userId: p.userId, name: p.name, connected: Boolean(p.socketId) })),
    winner: game.winner, createdAt: game.createdAt, startedAt: game.startedAt, endedAt: game.endedAt,
    settings: { maxPlayers: game.settings.maxPlayers, guessTimeSec: game.settings.guessTimeSec }
  };
}

async function finishGame(game, accusedId = null, accuserId = null) {
  if (game.status === 'ended') return { results: game.results, winnerId: game.winner, alreadyFinished: true };
  const outcome = calculateScores(game, accusedId);
  const correct = Boolean(accusedId && outcome.playerResults.find((p) => p.userId.toString() === accusedId.toString())?.role === 'CHOR');
  game.status = 'ended'; game.guessMade = Boolean(accusedId); game.guess = accusedId ? { accuserId, accusedId, correct } : undefined;
  game.winner = outcome.winnerId; game.results = outcome.playerResults; game.endedAt = new Date();
  await game.save();
  await Promise.all(outcome.playerResults.map(async (item) => {
    await GameHistory.create({ gameId: game._id, userId: item.userId, role: item.role, result: item.result, points: item.points });
    await User.findByIdAndUpdate(item.userId, { $inc: { points: item.points, gamesPlayed: 1, gamesWon: item.winner ? 1 : 0 } });
  }));
  return outcome;
}

module.exports = { publicGame, finishGame };

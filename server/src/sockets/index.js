const jwt = require('jsonwebtoken');
const Game = require('../models/Game');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const { publicGame, finishGame } = require('../services/gameService');

function serializeChatMessage(message) {
  const sender = message.senderId || {};
  return {
    id: String(message._id),
    userId: String(sender._id || sender),
    name: sender.name || 'Player',
    message: message.text,
    sentAt: new Date(message.createdAt).toISOString()
  };
}

function initSockets(io) {
  const timers = new Map();
  const finishTimer = (code) => { const timer = timers.get(code); if (timer) { clearInterval(timer.interval); clearTimeout(timer.timeout); timers.delete(code); } };
  const beginTimer = (game) => {
    finishTimer(game.gameCode); let timeLeft = game.settings.guessTimeSec;
    const interval = setInterval(() => { timeLeft -= 1; io.to(game.gameCode).emit('timer_update', { timeLeft: Math.max(timeLeft, 0) }); }, 1000);
    const timeout = setTimeout(async () => { try { const fresh = await Game.findOne({ gameCode: game.gameCode }); if (fresh?.status === 'started') { const result = await finishGame(fresh); io.to(game.gameCode).emit('game_result', { ...result, timedOut: true }); } } finally { finishTimer(game.gameCode); } }, timeLeft * 1000);
    timers.set(game.gameCode, { interval, timeout }); io.to(game.gameCode).emit('timer_update', { timeLeft });
  };
  
  io.use(async (socket, next) => { try { const token = socket.handshake.auth?.token; const decoded = jwt.verify(token, process.env.JWT_SECRET); const user = await User.findById(decoded.id).select('name'); if (!user) throw new Error(); socket.user = user; next(); } catch (_) { next(new Error('Authentication required')); } });
  io.on('connection', (socket) => {
    socket.on('join_lobby', async (payload = {}, ack = () => {}) => { try { const code = String(payload.gameCode || '').trim().toUpperCase(); const game = await Game.findOne({ gameCode: code }); if (!game) throw new Error('Room not found'); const player = game.players.find((p) => p.userId.equals(socket.user._id)); if (!player) throw new Error('Join this room before opening its chat'); for (const existingPlayer of game.players) if (existingPlayer.socketId && !io.sockets.sockets.has(existingPlayer.socketId)) existingPlayer.socketId = undefined; if (player.socketId && player.socketId !== socket.id) io.sockets.sockets.get(player.socketId)?.leave(game.gameCode); player.socketId = socket.id; await game.save(); await socket.join(game.gameCode); const history = await ChatMessage.find({ roomId: game._id }).sort({ createdAt: -1, _id: -1 }).limit(100).populate('senderId', 'name').lean(); socket.emit('chat:history', history.reverse().map(serializeChatMessage)); ack({ game: publicGame(game), myRole: game.status === 'started' ? game.roles.get(socket.user._id.toString()) : null }); io.to(game.gameCode).emit('game_state', { game: publicGame(game) }); } catch (error) { ack({ error: error.message }); socket.emit('chat:error', { message: error.message }); } });
    socket.on('chat:send', async (payload = {}, ack = () => {}) => {
      try {
        const code = String(payload.gameCode || '').trim().toUpperCase();
        const text = String(payload.message || '').trim();
        if (!text) throw new Error('Write a message first');
        if (text.length > 500) throw new Error('Messages must be 500 characters or fewer');
        const game = await Game.findOne({ gameCode: code });
        const player = game?.players.find((p) => p.userId.equals(socket.user._id));
        if (!game || !player || player.socketId !== socket.id || !socket.rooms.has(game.gameCode)) throw new Error('Join this room before chatting');
        if (game.status === 'ended') throw new Error('Chat is closed because this game has ended');
        const saved = await ChatMessage.create({ roomId: game._id, senderId: socket.user._id, text });
        const item = { id: String(saved._id), userId: socket.user._id.toString(), name: player.name, message: saved.text, sentAt: saved.createdAt.toISOString() };
        io.to(game.gameCode).emit('chat:message', item);
        ack({ ok: true });
      } catch (error) { const message = error.message || 'Could not send your message'; ack({ error: message }); socket.emit('chat:error', { message }); }
    });
    socket.on('start_game', async ({ gameCode }, ack = () => {}) => { try { const game = await Game.findOne({ gameCode: String(gameCode).trim().toUpperCase() }); if (!game || !game.hostId.equals(socket.user._id)) throw new Error('Only the host can start'); if (game.status !== 'waiting') throw new Error('This game has already started'); if (game.players.length !== game.settings.maxPlayers) throw new Error(`Four players are required (${game.players.length}/${game.settings.maxPlayers} joined)`); const connectedCount = game.players.filter((player) => player.socketId && io.sockets.sockets.has(player.socketId)).length; if (connectedCount !== game.settings.maxPlayers) { for (const player of game.players) if (player.socketId && !io.sockets.sockets.has(player.socketId)) player.socketId = undefined; await game.save(); io.to(game.gameCode).emit('game_state', { game: publicGame(game) }); throw new Error(`All players must be connected before starting (${connectedCount}/${game.settings.maxPlayers} connected)`); } game.roles = require('../utils/gameUtils').assignRoles(game.players); game.status = 'started'; game.startedAt = new Date(); await game.save(); for (const p of game.players) io.to(p.socketId).emit('role_assigned', { role: game.roles.get(p.userId.toString()) }); io.to(game.gameCode).emit('game_started', { game: publicGame(game) }); beginTimer(game); ack({ ok: true }); } catch (error) { ack({ error: error.message }); } });
    socket.on('make_guess', async ({ gameCode, accusedId }, ack = () => {}) => { try { const game = await Game.findOne({ gameCode: String(gameCode).toUpperCase() }); if (!game || game.status !== 'started' || game.guessMade) throw new Error('This game cannot accept a guess'); if (game.roles.get(socket.user._id.toString()) !== 'SIPAHI') throw new Error('Only Sipahi can make an accusation'); const accused = game.players.find((p) => p.userId.toString() === String(accusedId)); if (!accused || accused.userId.equals(socket.user._id)) throw new Error('Choose a valid opponent'); const result = await finishGame(game, accused.userId, socket.user._id); finishTimer(game.gameCode); io.to(game.gameCode).emit('game_result', result); ack({ ok: true }); } catch (error) { ack({ error: error.message }); } });
    socket.on('disconnect', async () => { const games = await Game.find({ 'players.socketId': socket.id, status: { $ne: 'ended' } }); for (const game of games) { const player = game.players.find((p) => p.socketId === socket.id); if (player) { player.socketId = undefined; await game.save(); io.to(game.gameCode).emit('game_state', { game: publicGame(game) }); } } });
  });
  return { beginTimer, finishTimer };
}
module.exports = { initSockets };

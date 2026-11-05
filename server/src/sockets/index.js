const jwt = require('jsonwebtoken');
const Game = require('../models/Game');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const { publicGame, finishGame, resetRoundState, startNewRound } = require('../services/gameService');

function serializeChatMessage(message) {
  const sender = message.senderId || {};
  return {
    id: String(message._id),
    userId: String(sender._id || sender),
    name: sender.name || message.senderUsername || 'Player',
    message: message.text,
    sentAt: new Date(message.createdAt).toISOString(),
    replyToMessageId: message.replyToMessageId ? String(message.replyToMessageId) : null,
    replyToUsername: message.replyToUsername || '',
    replyToMessage: message.replyToMessage || '',
    roomId: message.roomId ? String(message.roomId) : null
  };
}

function ensureReadyPlayers(game) {
  return (game.rematchVotes || []).map((userId) => String(userId));
}

function initSockets(io) {
  const timers = new Map();
  const finishTimer = (code) => {
    const timer = timers.get(code);
    if (timer) {
      clearInterval(timer.interval);
      clearTimeout(timer.timeout);
      timers.delete(code);
    }
  };

  const beginTimer = (game) => {
    finishTimer(game.gameCode);
    let timeLeft = game.settings.guessTimeSec;
    const interval = setInterval(() => {
      timeLeft -= 1;
      io.to(game.gameCode).emit('timer_update', { timeLeft: Math.max(timeLeft, 0) });
    }, 1000);
    const timeout = setTimeout(async () => {
      try {
        const fresh = await Game.findOne({ gameCode: game.gameCode });
        if (fresh?.status === 'started') {
          const result = await finishGame(fresh);
          io.to(game.gameCode).emit('game_result', { ...result, timedOut: true });
        }
      } finally {
        finishTimer(game.gameCode);
      }
    }, timeLeft * 1000);
    timers.set(game.gameCode, { interval, timeout });
    io.to(game.gameCode).emit('timer_update', { timeLeft });
  };

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name');
      if (!user) throw new Error();
      socket.user = user;
      next();
    } catch (_) {
      next(new Error('Authentication required'));
    }
  });

  io.on('connection', (socket) => {
    const handleChatSend = async (payload = {}, ack = () => {}) => {
      try {
        const code = String(payload.gameCode || '').trim().toUpperCase();
        const text = String(payload.message || '').trim();
        const replyToMessageId = payload.replyToMessageId ? String(payload.replyToMessageId) : null;
        const replyToUsername = payload.replyToUsername ? String(payload.replyToUsername) : '';
        const replyToMessage = payload.replyToMessage ? String(payload.replyToMessage) : '';
        if (!text) throw new Error('Write a message first');
        if (text.length > 500) throw new Error('Messages must be 500 characters or fewer');
        const game = await Game.findOne({ gameCode: code });
        const player = game?.players.find((p) => p.userId.equals(socket.user._id));
        if (!game || !player || player.socketId !== socket.id || !socket.rooms.has(game.gameCode)) throw new Error('Join this room before chatting');

        const replyMessage = replyToMessageId ? await ChatMessage.findById(replyToMessageId).lean() : null;
        const safeReplyToMessageId = replyMessage ? replyMessage._id : null;
        const safeReplyToUsername = replyToUsername || (replyMessage && replyMessage.senderUsername) || '';
        const safeReplyToMessage = replyToMessage || (replyMessage && replyMessage.text) || '';

        const saved = await ChatMessage.create({
          roomId: game._id,
          senderId: socket.user._id,
          senderUsername: player.name,
          text,
          replyToMessageId: safeReplyToMessageId,
          replyToUsername: safeReplyToUsername,
          replyToMessage: safeReplyToMessage
        });

        const item = {
          id: String(saved._id),
          userId: socket.user._id.toString(),
          name: player.name,
          message: saved.text,
          sentAt: saved.createdAt.toISOString(),
          replyToMessageId: saved.replyToMessageId ? String(saved.replyToMessageId) : null,
          replyToUsername: saved.replyToUsername || '',
          replyToMessage: saved.replyToMessage || ''
        };

        io.to(game.gameCode).emit('chat:message', item);
        io.to(game.gameCode).emit('message:new', item);
        if (item.replyToMessageId) {
          io.to(game.gameCode).emit('message:reply:new', item);
          io.to(game.gameCode).emit('message:reply', item);
        }
        ack({ ok: true, item });
      } catch (error) {
        const message = error.message || 'Could not send your message';
        ack({ error: message });
        socket.emit('chat:error', { message });
      }
    };

    socket.on('chat:send', handleChatSend);
    socket.on('message:send', handleChatSend);
    socket.on('message:reply', handleChatSend);

    socket.on('join_lobby', async (payload = {}, ack = () => {}) => {
      try {
        const code = String(payload.gameCode || '').trim().toUpperCase();
        const game = await Game.findOne({ gameCode: code });
        if (!game) throw new Error('Room not found');
        const player = game.players.find((p) => p.userId.equals(socket.user._id));
        if (!player) throw new Error('Join this room before opening its chat');
        for (const existingPlayer of game.players) {
          if (existingPlayer.socketId && !io.sockets.sockets.has(existingPlayer.socketId)) existingPlayer.socketId = undefined;
        }
        if (player.socketId && player.socketId !== socket.id) io.sockets.sockets.get(player.socketId)?.leave(game.gameCode);
        player.socketId = socket.id;
        await game.save();
        await socket.join(game.gameCode);
        const history = await ChatMessage.find({ roomId: game._id }).sort({ createdAt: -1, _id: -1 }).limit(100).populate('senderId', 'name').lean();
        socket.emit('chat:history', history.reverse().map(serializeChatMessage));
        ack({ game: publicGame(game), myRole: game.status === 'started' ? game.roles.get(socket.user._id.toString()) : null, rematchVotes: ensureReadyPlayers(game) });
        io.to(game.gameCode).emit('game_state', { game: publicGame(game) });
      } catch (error) {
        ack({ error: error.message });
        socket.emit('chat:error', { message: error.message });
      }
    });

    socket.on('chat:typing', async (payload = {}) => {
      try {
        const code = String(payload.gameCode || '').trim().toUpperCase();
        if (!/^[A-Z0-9]{6}$/.test(code) || !socket.rooms.has(code)) return;
        const game = await Game.findOne({ gameCode: code, status: { $ne: 'ended' }, 'players.socketId': socket.id });
        const player = game?.players.find((item) => item.socketId === socket.id && item.userId.equals(socket.user._id));
        if (!game || !player) return;
        socket.to(code).emit('chat:typing', {
          userId: socket.user._id.toString(),
          name: player.name,
          isTyping: Boolean(payload.isTyping)
        });
      } catch (_) {
        // Typing updates are transient and should not interrupt message delivery.
      }
    });

    socket.on('start_game', async ({ gameCode }, ack = () => {}) => {
      try {
        const code = String(gameCode || '').trim().toUpperCase();
        const game = await Game.findOne({ gameCode: code });
        if (!game || !game.hostId.equals(socket.user._id)) throw new Error('Only the host can start');
        if (game.status !== 'waiting') throw new Error('This game has already started');
        if (game.players.length !== game.settings.maxPlayers) throw new Error(`Four players are required (${game.players.length}/${game.settings.maxPlayers} joined)`);
        const connectedCount = game.players.filter((player) => player.socketId && io.sockets.sockets.has(player.socketId)).length;
        if (connectedCount !== game.settings.maxPlayers) {
          for (const player of game.players) if (player.socketId && !io.sockets.sockets.has(player.socketId)) player.socketId = undefined;
          await game.save();
          io.to(game.gameCode).emit('game_state', { game: publicGame(game) });
          throw new Error(`All players must be connected before starting (${connectedCount}/${game.settings.maxPlayers} connected)`);
        }
        game.roles = require('../utils/gameUtils').assignRoles(game.players);
        game.status = 'started';
        game.roundNumber = game.roundNumber || 1;
        game.roundId = new (require('mongoose').Types.ObjectId)().toString();
        game.startedAt = new Date();
        game.endedAt = null;
        game.guessMade = false;
        game.guess = undefined;
        game.mantriGuess = undefined;
        game.results = [];
        game.winner = undefined;
        game.rematchVotes = [];
        await game.save();
        for (const p of game.players) io.to(p.socketId).emit('role_assigned', { role: game.roles.get(p.userId.toString()) });
        io.to(game.gameCode).emit('game_started', { game: publicGame(game) });
        beginTimer(game);
        ack({ ok: true });
      } catch (error) {
        ack({ error: error.message });
      }
    });

    socket.on('make_guess', async ({ gameCode, accusedId }, ack = () => {}) => {
      try {
        const game = await Game.findOne({ gameCode: String(gameCode).toUpperCase() });
        if (!game || game.status !== 'started' || game.guessMade) throw new Error('This game cannot accept a guess');
        if (game.roles.get(socket.user._id.toString()) !== 'SIPAHI') throw new Error('Only Sipahi can make an accusation');
        const accused = game.players.find((p) => p.userId.toString() === String(accusedId));
        if (!accused || accused.userId.equals(socket.user._id)) throw new Error('Choose a valid opponent');
        const result = await finishGame(game, accused.userId, socket.user._id);
        finishTimer(game.gameCode);
        io.to(game.gameCode).emit('game_result', result);
        ack({ ok: true });
      } catch (error) {
        ack({ error: error.message });
      }
    });

    socket.on('mantri_guess', async ({ gameCode, suspectId }, ack = () => {}) => {
      try {
        const game = await Game.findOne({ gameCode: String(gameCode).toUpperCase() });
        if (!game || game.status !== 'started') throw new Error('This game cannot accept a mantri guess');
        if (game.guessMade || game.mantriGuess?.submittedBy?.toString() === socket.user._id.toString()) throw new Error('The Mantri has already submitted a guess for this round');
        if (game.roles.get(socket.user._id.toString()) !== 'MANTRI') throw new Error('Only the Mantri can identify the Chor');
        const suspect = game.players.find((p) => p.userId.toString() === String(suspectId));
        if (!suspect || suspect.userId.equals(socket.user._id)) throw new Error('Select a different player as the suspected Chor');
        const result = await finishGame(game, null, socket.user._id, suspect.userId);
        finishTimer(game.gameCode);
        io.to(game.gameCode).emit('game_result', { ...result, guessType: 'MANTRI' });
        ack({ ok: true, result });
      } catch (error) {
        ack({ error: error.message });
      }
    });

    socket.on('game:play-again', async ({ gameCode }, ack = () => {}) => {
      try {
        const code = String(gameCode || '').trim().toUpperCase();
        const game = await Game.findOne({ gameCode: code });
        if (!game) throw new Error('Room not found');
        if (!game.players.some((player) => player.userId.equals(socket.user._id))) throw new Error('Join this room to confirm a new round');
        const readySet = new Set((game.rematchVotes || []).map((userId) => userId.toString()));
        if (!readySet.has(socket.user._id.toString())) readySet.add(socket.user._id.toString());
        game.rematchVotes = Array.from(readySet).map((userId) => new (require('mongoose').Types.ObjectId)(userId));
        game.status = 'rematch_waiting';
        await game.save();

        const readyCount = game.rematchVotes.length;
        const totalPlayers = game.settings.maxPlayers;
        io.to(code).emit('game:player-ready', { gameCode: code, readyCount, totalPlayers, userId: socket.user._id.toString() });
        io.to(code).emit('game_state', { game: publicGame(game) });

        if (readyCount >= totalPlayers) {
          const freshGame = await Game.findOne({ gameCode: code });
          if (!freshGame) throw new Error('Room not found');
          const started = startNewRound(freshGame);
          started.roundNumber = (started.roundNumber || 1);
          started.rematchVotes = [];
          await started.save();
          for (const p of started.players) io.to(p.socketId).emit('role_assigned', { role: started.roles.get(p.userId.toString()) });
          io.to(code).emit('game:restart', { game: publicGame(started), readyCount: 0 });
          io.to(code).emit('rematch_ready', { game: publicGame(started), readyCount: 0 });
          io.to(code).emit('game_started', { game: publicGame(started) });
          beginTimer(started);
        }
        ack({ ok: true, readyCount, totalPlayers, started: readyCount >= totalPlayers });
      } catch (error) {
        ack({ error: error.message });
      }
    });

    socket.on('rematch_vote', async ({ gameCode }, ack = () => {}) => {
      try {
        const code = String(gameCode || '').trim().toUpperCase();
        const game = await Game.findOne({ gameCode: code });
        if (!game) throw new Error('Room not found');
        if (game.status !== 'ended' && game.status !== 'rematch_waiting') throw new Error('Rematch can only be requested after a round ends');
        if (game.players.every((player) => !player.userId.equals(socket.user._id))) throw new Error('Join this room to vote for another round');
        const votes = new Set((game.rematchVotes || []).map((userId) => userId.toString()));
        if (!votes.has(socket.user._id.toString())) votes.add(socket.user._id.toString());
        game.rematchVotes = Array.from(votes).map((userId) => new (require('mongoose').Types.ObjectId)(userId));
        game.status = 'rematch_waiting';
        await game.save();

        const readyCount = game.rematchVotes.length;
        io.to(code).emit('game:player-ready', { gameCode: code, readyCount, totalPlayers: game.settings.maxPlayers, userId: socket.user._id.toString() });
        io.to(code).emit('game_state', { game: publicGame(game) });

        if (readyCount >= game.settings.maxPlayers) {
          const freshGame = await Game.findOne({ gameCode: code });
          if (!freshGame) throw new Error('Room not found');
          const started = startNewRound(freshGame);
          started.roundNumber = (started.roundNumber || 1);
          started.rematchVotes = [];
          await started.save();
          for (const p of started.players) io.to(p.socketId).emit('role_assigned', { role: started.roles.get(p.userId.toString()) });
          io.to(code).emit('rematch_ready', { game: publicGame(started), readyCount: 0 });
          io.to(code).emit('game:restart', { game: publicGame(started), readyCount: 0 });
          io.to(code).emit('game_started', { game: publicGame(started) });
          beginTimer(started);
        }
        ack({ ok: true, readyCount, totalPlayers: game.settings.maxPlayers, started: readyCount >= game.settings.maxPlayers });
      } catch (error) {
        ack({ error: error.message });
      }
    });

    socket.on('start_next_round', async ({ gameCode }, ack = () => {}) => {
      try {
        const code = String(gameCode || '').trim().toUpperCase();
        const game = await Game.findOne({ gameCode: code });
        if (!game) throw new Error('Room not found');
        if (game.status !== 'rematch_waiting' && game.status !== 'ended') throw new Error('This room is not ready for a new round');
        if (game.players.length !== game.settings.maxPlayers) throw new Error('A full room is required for the next round');
        if ((game.rematchVotes || []).length < game.settings.maxPlayers) throw new Error('Waiting for all players to be ready');
        const connectedCount = game.players.filter((player) => player.socketId && io.sockets.sockets.has(player.socketId)).length;
        if (connectedCount !== game.settings.maxPlayers) throw new Error('Every player must be connected before the next round starts');
        const started = startNewRound(game);
        started.roundNumber = (started.roundNumber || 1);
        started.rematchVotes = [];
        await started.save();
        for (const p of started.players) io.to(p.socketId).emit('role_assigned', { role: started.roles.get(p.userId.toString()) });
        io.to(game.gameCode).emit('game_started', { game: publicGame(started) });
        io.to(game.gameCode).emit('game:restart', { game: publicGame(started), readyCount: 0 });
        beginTimer(started);
        ack({ ok: true });
      } catch (error) {
        ack({ error: error.message });
      }
    });

    socket.on('disconnect', async () => {
      const games = await Game.find({ 'players.socketId': socket.id, status: { $ne: 'ended' } });
      for (const game of games) {
        const player = game.players.find((p) => p.socketId === socket.id);
        if (player) {
          io.to(game.gameCode).emit('chat:typing', { userId: player.userId.toString(), name: player.name, isTyping: false });
          player.socketId = undefined;
          await game.save();
          io.to(game.gameCode).emit('game_state', { game: publicGame(game) });
        }
      }
    });
  });

  return { beginTimer, finishTimer };
}

module.exports = { initSockets };

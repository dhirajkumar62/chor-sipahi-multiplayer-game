require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const userRoutes = require('./routes/user');
const { initSockets } = require('./sockets');

// CLIENT_URL may be a comma-separated list in production. Keep Vite's local
// development origins available so browser preflight requests can succeed.
const allowedOrigins = [...new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean)
])];
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.set('io', io);
const timers = initSockets(io);
app.set('beginTimer', timers.beginTimer);
app.set('finishTimer', timers.finishTimer);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const PORT = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) console.warn('WARNING: set JWT_SECRET in server/.env before production use');
connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chor_sipahi');
server.listen(PORT, () => console.log(`Server running on port ${PORT}; allowed client origins: ${allowedOrigins.join(', ')}`));

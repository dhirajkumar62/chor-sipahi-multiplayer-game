const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signUserToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username || user.name,
  email: user.email,
  profilePicture: user.profilePicture || '',
  authProvider: user.authProvider || 'local',
  points: user.points || 0,
  gamesPlayed: user.gamesPlayed || 0,
  gamesWon: user.gamesWon || 0,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters' });
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: 'Email is already registered' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hash,
      authProvider: 'local'
    });
    const token = signUserToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.password) return res.status(401).json({ message: 'This account uses Google sign-in. Please continue with Google.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signUserToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.googleLogin = async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ message: 'Google credential is required.' });
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ message: 'Google sign-in is not configured on the server.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
      return res.status(401).json({ message: 'Google account email could not be verified.' });
    }

    const email = payload.email.trim().toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || payload.given_name || 'Player';
    const profilePicture = payload.picture || '';

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = await User.create({
        name,
        username: payload.given_name || name,
        email,
        googleId,
        profilePicture,
        password: null,
        authProvider: 'google'
      });
    } else {
      const updates = {
        name: user.name || name,
        email,
        profilePicture: user.profilePicture || profilePicture,
        authProvider: user.authProvider === 'local' ? 'local' : 'google'
      };

      if (!user.googleId) updates.googleId = googleId;
      if (!user.username && payload.given_name) updates.username = payload.given_name;
      if (!user.password && user.authProvider !== 'google') updates.authProvider = 'google';

      Object.assign(user, updates);
      await user.save();
    }

    if (!user.googleId && googleId) {
      user.googleId = googleId;
      user.authProvider = user.authProvider === 'local' ? 'google' : user.authProvider;
      await user.save();
    }

    const token = signUserToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Google auth error:', err.message || err);
    const status = err.code === 11000 ? 409 : 401;
    const message = err.code === 11000
      ? 'This Google account is already linked to another user.'
      : 'Google authentication failed. Please try again.';
    res.status(status).json({ message });
  }
};

exports.me = async (req, res) => {
  const user = req.user;
  res.json({ user: sanitizeUser(user) });
};

exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  if (!cleanName) return res.status(400).json({ message: 'Name cannot be empty' });
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return res.status(400).json({ message: 'Enter a valid email address' });

  try {
    const existingUser = await User.findOne({ email: cleanEmail, _id: { $ne: req.user._id } });
    if (existingUser) return res.status(409).json({ message: 'Email is already registered' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = cleanName;
    user.email = cleanEmail;
    user.username = user.username || cleanName;
    await user.save();

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

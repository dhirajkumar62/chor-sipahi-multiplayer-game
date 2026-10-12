const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const auth = require('../middleware/auth');

router.post('/create', auth, gameController.createGame);
router.post('/join', auth, gameController.joinGame);
router.get('/history', auth, gameController.getHistory);
router.get('/leaderboard', auth, gameController.getLeaderboard);
router.get('/:gameCode', auth, gameController.getGame);
router.post('/:gameCode/start', auth, gameController.startGame);
router.post('/:gameCode/guess', auth, gameController.makeGuess);

module.exports = router;

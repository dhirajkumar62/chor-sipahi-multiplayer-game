const router = require('express').Router();
const auth = require('../middleware/auth');
router.get('/profile', auth, (req, res) => res.json({ user: req.user }));
module.exports = router;

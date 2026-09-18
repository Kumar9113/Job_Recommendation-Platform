const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getMe, updateMe } = require('../controllers/user.controller');

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

module.exports = router;

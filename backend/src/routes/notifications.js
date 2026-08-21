const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notifController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getNotifications);

module.exports = router;

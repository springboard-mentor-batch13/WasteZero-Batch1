const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const messageController = require('../controllers/messageController');

router.get('/:userId', authMiddleware, messageController.getMessages);

module.exports = router;

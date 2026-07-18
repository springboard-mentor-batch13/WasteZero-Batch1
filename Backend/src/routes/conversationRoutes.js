const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const conversationController = require('../controllers/conversationController');

router.get('/', authMiddleware, conversationController.getConversations);

module.exports = router;

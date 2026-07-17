

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const opportunityRoutes = require('./opportunityRoutes');
const messageRoutes = require('./messageRoutes');
const conversationRoutes = require('./conversationRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/messages', messageRoutes);
router.use('/conversations', conversationRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;

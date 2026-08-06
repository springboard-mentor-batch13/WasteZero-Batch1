const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const opportunityRoutes = require('./opportunityRoutes');
const applicationRoutes = require('./applicationRoutes');
const messageRoutes = require('./messageRoutes');
const pickupRoutes = require('./pickupRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/applications', applicationRoutes);
router.use('/messages', messageRoutes);
router.use('/pickups', pickupRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;

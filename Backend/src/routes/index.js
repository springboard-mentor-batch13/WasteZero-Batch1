const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const opportunityRoutes = require('./opportunityRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/opportunities', opportunityRoutes);

module.exports = router;

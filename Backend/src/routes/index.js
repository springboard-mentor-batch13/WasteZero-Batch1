const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const opportunityRoutes = require('./opportunityRoutes');
const applicationRoutes = require('./applicationRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/applications', applicationRoutes);

module.exports = router;

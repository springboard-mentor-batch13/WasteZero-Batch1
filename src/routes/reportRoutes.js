const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');
const reportController = require('../controllers/reportController');

router.use(authMiddleware);

router.get('/users', authorize(ROLES.ADMIN), reportController.getUsersReport);
router.get('/pickups', authorize(ROLES.ADMIN), reportController.getPickupsReport);
router.get('/opportunities', authorize(ROLES.ADMIN), reportController.getOpportunitiesReport);
router.get('/activity', authorize(ROLES.ADMIN), reportController.getActivityReport);

module.exports = router;

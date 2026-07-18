const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { 
  getProfile, 
  updateProfile, 
  deleteAccount, 
  initiatePasswordChange, 
  confirmPasswordChange 
} = require('../controllers/userController');

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.delete('/profile', deleteAccount);

router.post('/change-password-init', initiatePasswordChange);
router.post('/change-password-confirm', confirmPasswordChange);

module.exports = router;
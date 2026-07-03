const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyOtpLimiter, resendOtpLimiter } = require('../middlewares/rateLimitMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', verifyOtpLimiter, authController.verifyEmail);
router.post('/resend-otp', resendOtpLimiter, authController.resendOtp);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyOtpLimiter, resendOtpLimiter, forgotPasswordLimiter, resetPasswordLimiter } = require('../middlewares/rateLimitMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', verifyOtpLimiter, authController.verifyEmail);
router.post('/resend-otp', resendOtpLimiter, authController.resendOtp);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);

module.exports = router;

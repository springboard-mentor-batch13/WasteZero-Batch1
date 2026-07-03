const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter, registerLimiter, verifyOtpLimiter, resendOtpLimiter, forgotPasswordLimiter, resetPasswordLimiter, refreshTokenLimiter } = require('../middlewares/rateLimitMiddleware');

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/verify-email', verifyOtpLimiter, authController.verifyEmail);
router.post('/resend-otp', resendOtpLimiter, authController.resendOtp);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);
router.post('/refresh-token', refreshTokenLimiter, authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;

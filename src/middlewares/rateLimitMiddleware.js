const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: () => ({
      success: false,
      message,
      errors: [],
      timestamp: new Date().toISOString()
    }),
    standardHeaders: true,
    legacyHeaders: false
  });
};

const verifyOtpLimiter = createLimiter(
  60 * 1000,
  5,
  'Too many verification attempts. Please try again later.'
);

const resendOtpLimiter = createLimiter(
  60 * 1000,
  1,
  'Too many resend requests. Please wait before requesting again.'
);

const forgotPasswordLimiter = createLimiter(
  60 * 1000,
  3,
  'Too many password reset requests. Please try again later.'
);

const resetPasswordLimiter = createLimiter(
  60 * 1000,
  5,
  'Too many reset attempts. Please try again later.'
);

module.exports = { verifyOtpLimiter, resendOtpLimiter, forgotPasswordLimiter, resetPasswordLimiter };

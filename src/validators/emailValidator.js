const Joi = require('joi');
const { OTP_LENGTH } = require('../constants/security');

const OTP_REGEX = new RegExp(`^\\d{${OTP_LENGTH}}$`);

const verifyEmailSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required'
  }),
  otp: Joi.string().pattern(OTP_REGEX).required().messages({
    'string.pattern.base': `OTP must be exactly ${OTP_LENGTH} digits`,
    'string.empty': 'OTP is required'
  })
}).unknown(false);

const resendOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required'
  })
}).unknown(false);

const validateVerifyEmail = (data) => verifyEmailSchema.validate(data, { abortEarly: false });
const validateResendOtp = (data) => resendOtpSchema.validate(data, { abortEarly: false });

module.exports = { validateVerifyEmail, validateResendOtp };

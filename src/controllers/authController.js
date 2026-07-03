const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { validateVerifyEmail, validateResendOtp, validateForgotPassword, validateResetPassword } = require('../validators/emailValidator');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  const { error, value } = validateRegister(req.body);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  const result = await authService.register(value);
  return ApiResponse.created(res, 'Registration successful', result);
});

const login = asyncHandler(async (req, res) => {
  const { error, value } = validateLogin(req.body);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  const result = await authService.login(value);
  return ApiResponse.ok(res, 'Login successful', result);
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { error, value } = validateVerifyEmail(req.body);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  const result = await authService.verifyEmail(value.email, value.otp);
  return ApiResponse.ok(res, result.message, result);
});

const resendOtp = asyncHandler(async (req, res) => {
  const { error, value } = validateResendOtp(req.body);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  const result = await authService.resendOtp(value.email);
  return ApiResponse.ok(res, result.message, result);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { error, value } = validateForgotPassword(req.body);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  const result = await authService.forgotPassword(value.email);
  return ApiResponse.ok(res, result.message, result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { error, value } = validateResetPassword(req.body);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  const result = await authService.resetPassword(value.email, value.otp, value.password);
  return ApiResponse.ok(res, result.message, result);
});

module.exports = { register, login, verifyEmail, resendOtp, forgotPassword, resetPassword };

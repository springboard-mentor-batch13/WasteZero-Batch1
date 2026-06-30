const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { validateRegister, validateLogin } = require('../validators/authValidator');
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

module.exports = { register, login };

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { validateUpdateProfile } = require('../validators/userValidator');
const userService = require('../services/userService');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  return ApiResponse.ok(res, 'Profile fetched successfully', { user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { error, value } = validateUpdateProfile(req.body);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  const user = await userService.updateProfile(req.user.id, value);
  return ApiResponse.ok(res, 'Profile updated successfully', { user });
});

module.exports = { getProfile, updateProfile };

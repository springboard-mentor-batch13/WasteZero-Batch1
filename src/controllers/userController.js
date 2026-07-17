const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const bcrypt = require('bcrypt');
const { generateOtp, hashOtp, verifyOtp } = require('../services/otpService');
const { sendOtpEmail } = require('../services/emailService');
const { validateUpdateProfile } = require('../validators/userValidator');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return ApiResponse.ok(res, 'Profile fetched successfully', { user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { error, value } = validateUpdateProfile(req.body);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: value },
    { returnDocument: 'after', runValidators: true }
  ).select('-password');

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return ApiResponse.ok(res, 'Profile updated successfully', { user });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return ApiResponse.ok(res, 'Account deleted successfully');
});

exports.initiatePasswordChange = asyncHandler(async (req, res) => {
  const { currentPassword } = req.body;
  
  const user = await User.findById(req.user.id).select('+password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Incorrect current password' });
  }

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

  await sendOtpEmail(user.email, otp, 'forgotPassword');

  await User.findByIdAndUpdate(req.user.id, {
    $set: {
      passwordResetOtp: hashedOtp,
      passwordResetOtpExpires: expiresAt,
      passwordResetAttempts: 0
    }
  });

  return ApiResponse.ok(res, 'OTP sent to your registered email');
});

exports.confirmPasswordChange = asyncHandler(async (req, res) => {
  const { otp, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+passwordResetOtp +passwordResetOtpExpires');

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (!user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP has expired. Please try again.' });
  }

  const isValid = await verifyOtp(otp, user.passwordResetOtp);
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(req.user.id, {
    $set: {
      password: hashedPassword,
      passwordResetOtp: null,
      passwordResetOtpExpires: null,
      passwordResetAttempts: 0
    }
  });

  return ApiResponse.ok(res, 'Password updated successfully');
});
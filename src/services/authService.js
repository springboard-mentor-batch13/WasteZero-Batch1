const bcrypt = require('bcrypt');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sanitizeUser } = require('../utils/token');
const { generateOtp, hashOtp, verifyOtp } = require('./otpService');
const { sendOtpEmail } = require('./emailService');
const tokenService = require('./tokenService');
const {
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS,
  MAX_OTP_RESEND,
  OTP_COOLDOWN_SECONDS,
  OTP_LOCK_HOURS,
  SALT_ROUNDS
} = require('../constants/security');

const register = async ({ name, email, password, role, skills, location, bio }, req = {}) => {
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw ApiError.conflict('A user with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    skills: skills || [],
    location: location || '',
    bio: bio || ''
  });

  let emailWarning = false;
  try {
    await generateAndStoreOtp(user);
  } catch (err) {
    emailWarning = true;
  }

  const accessToken = tokenService.generateAccessToken(user._id, user.role);
  const userAgent = req.headers ? req.headers['user-agent'] || '' : '';
  const ipAddress = req.ip || req.connection?.remoteAddress || '';
  const { token: refreshToken, expiresAt } = await tokenService.generateRefreshToken(
    user._id, false, userAgent, ipAddress
  );
  const result = { accessToken, refreshToken, expiresAt, user: sanitizeUser(user) };

  if (emailWarning) {
    result.warning = 'Account created but verification email could not be sent. You can request a new OTP from the resend endpoint.';
  }

  return result;
};

const login = async ({ email, password, rememberMe }, req = {}) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isEmailVerified) {
    throw ApiError.forbidden('Please verify your email before logging in');
  }

  const accessToken = tokenService.generateAccessToken(user._id, user.role);
  const userAgent = req.headers ? req.headers['user-agent'] || '' : '';
  const ipAddress = req.ip || req.connection?.remoteAddress || '';
  const { token: refreshToken, expiresAt } = await tokenService.generateRefreshToken(
    user._id, rememberMe, userAgent, ipAddress
  );

  return { accessToken, refreshToken, expiresAt, user: sanitizeUser(user) };
};

const verifyEmail = async (email, otp) => {
  const user = await User.findOne({ email }).select('+emailVerificationOtp');
  if (!user) {
    throw ApiError.notFound('User not found with this email');
  }

  if (user.isEmailVerified) {
    return { message: 'Email already verified' };
  }

  if (user.emailVerificationLockedUntil) {
    if (user.emailVerificationLockedUntil > new Date()) {
      const remainingMs = user.emailVerificationLockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw ApiError.badRequest(`Too many attempts. Try again in ${remainingMin} minutes`);
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationAttempts: 0,
          emailVerificationLockedUntil: null
        }
      }
    );
  }

  if (!user.emailVerificationOtpExpires || user.emailVerificationOtpExpires < new Date()) {
    throw ApiError.badRequest('OTP has expired. Please request a new one');
  }

  const isValid = await verifyOtp(otp, user.emailVerificationOtp);
  if (!isValid) {
    const attempts = (user.emailVerificationAttempts || 0) + 1;

    const updateData = { emailVerificationAttempts: attempts };

    if (attempts >= MAX_OTP_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + OTP_LOCK_HOURS * 60 * 60 * 1000);
      updateData.emailVerificationLockedUntil = lockUntil;
    }

    await User.updateOne({ _id: user._id }, updateData);

    throw ApiError.badRequest('Invalid OTP');
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        isEmailVerified: true,
        emailVerificationOtp: null,
        emailVerificationOtpExpires: null,
        emailVerificationAttempts: 0,
        emailVerificationResendCount: 0,
        emailVerificationLockedUntil: null,
        lastOtpSentAt: null
      }
    }
  );

  return { message: 'Email verified successfully' };
};

const resendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw ApiError.notFound('User not found with this email');
  }

  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email is already verified');
  }

  if (user.emailVerificationResendCount >= MAX_OTP_RESEND) {
    throw ApiError.badRequest('Maximum resend limit reached. Please try again later');
  }

  if (user.lastOtpSentAt) {
    const cooldownMs = OTP_COOLDOWN_SECONDS * 1000;
    const timeSinceLastOtp = Date.now() - user.lastOtpSentAt.getTime();
    if (timeSinceLastOtp < cooldownMs) {
      const remainingSec = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
      throw ApiError.badRequest(`Please wait ${remainingSec} seconds before requesting a new OTP`);
    }
  }

  await generateAndStoreOtp(user);
  await User.updateOne(
    { _id: user._id },
    { $inc: { emailVerificationResendCount: 1 } }
  );

  return { message: 'OTP sent successfully' };
};

const generateAndStoreOtp = async (user) => {
  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await sendOtpEmail(user.email, otp);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerificationOtp: hashedOtp,
        emailVerificationOtpExpires: expiresAt,
        emailVerificationAttempts: 0,
        lastOtpSentAt: new Date()
      }
    }
  );
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email }).lean();
  if (!user) {
    return { message: 'If an account exists with this email, a reset code has been sent' };
  }

  if (user.lastPasswordResetAt) {
    const cooldownMs = OTP_COOLDOWN_SECONDS * 1000;
    const timeSinceLastReset = Date.now() - new Date(user.lastPasswordResetAt).getTime();
    if (timeSinceLastReset < cooldownMs) {
      const remainingSec = Math.ceil((cooldownMs - timeSinceLastReset) / 1000);
      throw ApiError.badRequest(`Please wait ${remainingSec} seconds before requesting a new reset code`);
    }
  }

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await sendOtpEmail(user.email, otp, 'forgotPassword');

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordResetOtp: hashedOtp,
        passwordResetOtpExpires: expiresAt,
        passwordResetAttempts: 0,
        passwordResetResendCount: 0,
        passwordResetLockedUntil: null,
        lastPasswordResetAt: new Date()
      }
    }
  );

  return { message: 'If an account exists with this email, a reset code has been sent' };
};

const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email }).select('+passwordResetOtp');
  if (!user) {
    throw ApiError.badRequest('Invalid request');
  }

  if (user.passwordResetLockedUntil) {
    if (user.passwordResetLockedUntil > new Date()) {
      const remainingMs = user.passwordResetLockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw ApiError.badRequest(`Too many attempts. Try again in ${remainingMin} minutes`);
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetAttempts: 0,
          passwordResetLockedUntil: null
        }
      }
    );
  }

  if (!user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) {
    throw ApiError.badRequest('Reset code has expired. Please request a new one');
  }

  const isValid = await verifyOtp(otp, user.passwordResetOtp);
  if (!isValid) {
    const attempts = (user.passwordResetAttempts || 0) + 1;

    const updateData = { passwordResetAttempts: attempts };

    if (attempts >= MAX_OTP_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + OTP_LOCK_HOURS * 60 * 60 * 1000);
      updateData.passwordResetLockedUntil = lockUntil;
    }

    await User.updateOne({ _id: user._id }, updateData);

    throw ApiError.badRequest('Invalid reset code');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        password: hashedPassword,
        passwordResetOtp: null,
        passwordResetOtpExpires: null,
        passwordResetAttempts: 0,
        passwordResetResendCount: 0,
        passwordResetLockedUntil: null,
        lastPasswordResetAt: new Date()
      }
    }
  );

  return { message: 'Password updated successfully. Please log in again using your new password.' };
};

const refreshToken = async (plainRefreshToken) => {
  const doc = await tokenService.verifyRefreshToken(plainRefreshToken);
  if (!doc) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(doc.user).lean();
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (!user.isEmailVerified) {
    await tokenService.revokeRefreshToken(plainRefreshToken);
    throw ApiError.forbidden('Email not verified. Please verify your email before refreshing session');
  }

  const accessToken = tokenService.generateAccessToken(user._id, user.role);
  const { token: newRefreshToken, expiresAt } = await tokenService.rotateRefreshToken(
    plainRefreshToken,
    user._id,
    doc.rememberMe,
    doc.userAgent,
    doc.ipAddress
  );

  return { accessToken, refreshToken: newRefreshToken, expiresAt, user: sanitizeUser(user) };
};

const logout = async (plainRefreshToken) => {
  await tokenService.revokeRefreshToken(plainRefreshToken);
  return { message: 'Logged out successfully' };
};

module.exports = { register, login, verifyEmail, resendOtp, forgotPassword, resetPassword, refreshToken, logout };

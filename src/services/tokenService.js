const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const {
  ACCESS_TOKEN_EXPIRY_MINUTES,
  REFRESH_TOKEN_EXPIRY_DAYS,
  REFRESH_TOKEN_REMEMBER_EXPIRY_DAYS,
  REFRESH_TOKEN_BYTES
} = require('../constants/security');

const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: `${ACCESS_TOKEN_EXPIRY_MINUTES}m` }
  );
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateRefreshToken = async (userId, rememberMe = false, userAgent = '', ipAddress = '') => {
  const token = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  const tokenHash = hashToken(token);
  const expiryDays = rememberMe ? REFRESH_TOKEN_REMEMBER_EXPIRY_DAYS : REFRESH_TOKEN_EXPIRY_DAYS;
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user: userId,
    tokenHash,
    expiresAt,
    rememberMe,
    userAgent,
    ipAddress
  });

  return { token, expiresAt };
};

const verifyRefreshToken = async (plainToken) => {
  const tokenHash = hashToken(plainToken);
  const doc = await RefreshToken.findOne({ tokenHash });

  if (!doc) {
    return null;
  }

  if (doc.isRevoked) {
    return null;
  }

  if (doc.expiresAt < new Date()) {
    return null;
  }

  return doc;
};

const rotateRefreshToken = async (oldPlainToken, userId, rememberMe = false, userAgent = '', ipAddress = '') => {
  const tokenHash = hashToken(oldPlainToken);

  await RefreshToken.updateOne(
    { tokenHash },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );

  return generateRefreshToken(userId, rememberMe, userAgent, ipAddress);
};

const revokeRefreshToken = async (plainToken) => {
  const tokenHash = hashToken(plainToken);

  await RefreshToken.updateOne(
    { tokenHash },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );
};

const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany(
    { user: userId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );
};

module.exports = {
  generateAccessToken,
  hashToken,
  generateRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
};

const jwt = require('jsonwebtoken');

const verifySocketToken = (handshake) => {
  const token = handshake.auth?.token;

  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      userId: decoded.userId,
      role: decoded.role,
      exp: decoded.exp,
      iat: decoded.iat
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

module.exports = { verifySocketToken };

const bcrypt = require('bcrypt');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateToken, sanitizeUser } = require('../utils/token');

const register = async ({ name, email, password, role, skills, location, bio }) => {
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

  const token = generateToken(user._id, user.role);

  return { token, user: sanitizeUser(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken(user._id, user.role);

  return { token, user: sanitizeUser(user) };
};

module.exports = { register, login };

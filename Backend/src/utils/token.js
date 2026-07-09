const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  skills: user.skills,
  location: user.location,
  bio: user.bio,
  isEmailVerified: user.isEmailVerified
});

module.exports = { sanitizeUser };

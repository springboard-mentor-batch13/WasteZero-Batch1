const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  skills: user.skills,
  bio: user.bio,
  isEmailVerified: user.isEmailVerified,
  publicKey: user.publicKey || null
});

module.exports = { sanitizeUser };

const jwt = require('jsonwebtoken');

// Generate a signed JWT for a given user id
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Set the JWT as an httpOnly cookie AND return it in the JSON body,
// so the frontend can use either cookie-based or header-based auth.
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const days = parseInt(process.env.COOKIE_EXPIRES_DAYS || '7', 10);
  const options = {
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: user.toSafeObject ? user.toSafeObject() : user
    });
};

module.exports = { generateToken, sendTokenResponse };

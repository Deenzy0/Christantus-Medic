const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendTokenResponse } = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

// @desc    Register a new user + send verification email
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with that email already exists.' });
  }

  const user = new User({ name, email, password, phone });

  // Generate verification token and save it (hashed) on the user
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // Send verification email — non-blocking: if email fails, user is
  // still registered and can request a new verification email later.
  try {
    await sendVerificationEmail(user.email, user.name.split(' ')[0], verificationToken);
  } catch (emailErr) {
    console.error('Verification email failed to send:', emailErr.message);
    // Don't fail the registration — user can resend later
  }

  res.status(201).json({
    success: true,
    message: `Account created! We sent a verification link to ${user.email}. Please check your inbox (and spam folder) to activate your account.`,
    // Don't issue a JWT here — force email verification first
    requiresVerification: true
  });
});

// @desc    Verify email address via token from email link
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'This verification link is invalid or has expired. Please request a new one.'
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Issue JWT so the user is logged in immediately after verifying
  sendTokenResponse(user, 200, res);
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    // Don't reveal whether the email exists
    return res.status(200).json({ success: true, message: 'If that email is registered, a verification link has been sent.' });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ success: false, message: 'This email address is already verified.' });
  }

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendVerificationEmail(user.email, user.name.split(' ')[0], verificationToken);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again.' });
  }

  res.status(200).json({ success: true, message: `Verification link resent to ${email}.` });
});

// @desc    Log in — requires verified email
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'This account has been deactivated. Contact support.' });
  }

  // Block login if email not verified (admins are pre-verified via seed)
  if (!user.isEmailVerified && user.role === 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
      requiresVerification: true,
      email: user.email
    });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Log out
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Update profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'address'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, user: user.toSafeObject() });
});

// @desc    Change password (logged-in user)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to prevent email enumeration attacks
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, user.name.split(' ')[0], resetToken);
  } catch (err) {
    // Clean up tokens so user can try again
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
  }

  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  });
});

// @desc    Reset password using token from email
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'This reset link is invalid or has expired. Please request a new one.'
    });
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'Nigeria' }
    },
    role: {
      type: String,
      enum: ['customer', 'pharmacist', 'admin'],
      default: 'customer'
    },
    isActive: {
      type: Boolean,
      default: true
    },

    // ── Email Verification ──────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      select: false
    },

    // ── Password Reset ──────────────────────────────────────────
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },

    lastLogin: {
      type: Date
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password on login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate a secure email verification token (stored as hash, sent as plain)
userSchema.methods.generateEmailVerificationToken = function () {
  const plainToken = crypto.randomBytes(32).toString('hex');
  // Store a SHA-256 hash of the token so that even if the DB is
  // breached, the raw token (in the email link) can't be reused.
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return plainToken; // returned to caller so it can be emailed
};

// Generate a secure password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const plainToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return plainToken;
};

// Safe object for JWT responses — strips all sensitive fields
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

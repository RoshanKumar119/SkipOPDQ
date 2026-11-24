const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../utils/errors');

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^[6-9]\d{9}$/; // Indian 10-digit mobile number

/** POST /api/auth/register – patients self-register (doctors/admins are created by admin). */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body || {};

  if (!name || !name.trim()) throw new ApiError(400, 'Name is required');
  if (!email || !EMAIL_RE.test(email)) throw new ApiError(400, 'Please enter a valid email');
  if (phone && !PHONE_RE.test(String(phone).replace(/\s+/g, ''))) {
    throw new ApiError(400, 'Please enter a valid 10-digit mobile number');
  }
  if (!password || password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({
    name: name.trim(),
    email,
    phone: phone ? String(phone).replace(/\s+/g, '') : '',
    password,
    role: 'patient',
  });

  res.status(201).json({ token: signToken(user._id), user });
});

/** POST /api/auth/login */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user._id), user });
});

/** GET /api/auth/me – current user (used to restore session on page load). */
exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

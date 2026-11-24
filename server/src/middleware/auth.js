const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../utils/errors');

/** Sign a JWT for the given user id. */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/** Require a valid `Authorization: Bearer <token>` header; attaches req.user. */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Please log in to continue');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Session expired, please log in again');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'Account no longer exists');
  req.user = user;
  next();
});

module.exports = { protect, signToken };

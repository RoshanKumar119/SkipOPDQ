/**
 * Small error helpers so controllers can `throw new ApiError(400, '...')`
 * and async route handlers forward errors to the central error middleware.
 */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Central Express error handler – converts Mongoose errors into friendly messages. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `A record with this ${field} already exists`;
  }

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ message });
}

module.exports = { ApiError, asyncHandler, errorHandler };

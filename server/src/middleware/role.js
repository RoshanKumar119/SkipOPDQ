const { ApiError } = require('../utils/errors');

/**
 * Role check middleware. Use after `protect`.
 * Example: router.post('/', protect, authorize('admin'), handler)
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { authorize };

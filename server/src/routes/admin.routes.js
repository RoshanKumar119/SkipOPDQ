const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect, authorize('admin'));
router.get('/stats', ctrl.stats);

module.exports = router;

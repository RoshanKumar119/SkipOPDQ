const router = require('express').Router();
const ctrl = require('../controllers/doctor.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Public
router.get('/', ctrl.list);
router.get('/specializations', ctrl.specializations);

// Logged-in doctor
router.get('/me', protect, authorize('doctor'), ctrl.me);
router.patch('/me/status', protect, authorize('doctor'), ctrl.updateMyStatus);

router.get('/:id', ctrl.getOne);

// Admin
router.post('/', protect, authorize('admin'), ctrl.create);
router.put('/:id', protect, authorize('admin'), ctrl.update);

module.exports = router;

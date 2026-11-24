const router = require('express').Router();
const ctrl = require('../controllers/queue.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Doctor queue controls (must be declared before /:doctorId)
router.get('/me/today', protect, authorize('doctor'), ctrl.myToday);
router.post('/me/call-next', protect, authorize('doctor'), ctrl.callNext);
router.post('/me/done', protect, authorize('doctor'), ctrl.markDone);
router.post('/me/skip', protect, authorize('doctor'), ctrl.skip);

// Public live snapshot
router.get('/:doctorId', ctrl.getQueue);

module.exports = router;

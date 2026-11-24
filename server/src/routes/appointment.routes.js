const router = require('express').Router();
const ctrl = require('../controllers/appointment.controller');
const change = require('../controllers/appointmentChange.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.post('/', authorize('patient'), ctrl.book);
router.get('/my', authorize('patient'), ctrl.my);
router.get('/', authorize('admin'), ctrl.list);
router.post('/walk-in', authorize('admin'), ctrl.walkIn);
router.get('/:id', ctrl.getOne);

// Cancellation & rescheduling (own booking for patients, any booking for admin)
router.patch('/:id/cancel', authorize('patient', 'admin'), change.cancel);
router.get('/:id/reschedule-options', authorize('patient', 'admin'), change.rescheduleOptions);
router.patch('/:id/reschedule', authorize('patient', 'admin'), change.reschedule);

module.exports = router;

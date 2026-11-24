const router = require('express').Router();
const ctrl = require('../controllers/schedule.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', ctrl.list);
router.post('/', protect, authorize('admin'), ctrl.create);
router.put('/:id', protect, authorize('admin'), ctrl.update);
router.delete('/:id', protect, authorize('admin'), ctrl.remove);

module.exports = router;

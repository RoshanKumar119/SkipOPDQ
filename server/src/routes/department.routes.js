const router = require('express').Router();
const ctrl = require('../controllers/department.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', ctrl.list);
router.post('/', protect, authorize('admin'), ctrl.create);
router.put('/:id', protect, authorize('admin'), ctrl.update);

module.exports = router;

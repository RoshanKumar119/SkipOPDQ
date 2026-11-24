/**
 * Phase 2 placeholder routes – all respond 501 "Not Implemented Yet".
 * Mounted under /api so the planned API surface is visible and documented.
 */
const router = require('express').Router();
const ctrl = require('../controllers/phase2.controller');
const { protect } = require('../middleware/auth');

// TODO: Phase 2 – notifications
router.post('/notifications/subscribe', protect, ctrl.subscribeAlerts);
router.get('/notifications/settings', protect, ctrl.notificationSettings);
router.put('/notifications/settings', protect, ctrl.notificationSettings);

// TODO: Phase 2 – analytics
router.get('/analytics/:report', protect, ctrl.analytics);

// TODO: Phase 2 – payments
router.post('/payments/priority-booking', protect, ctrl.priorityBooking);

// TODO: Phase 2 – ABHA / ABDM
router.post('/abha/link', protect, ctrl.linkAbha);

// TODO: Phase 2 – TV token display board
router.get('/display-board/:departmentId?', ctrl.displayBoard);

// TODO: Phase 2 – multi-hospital
router.get('/hospitals', ctrl.hospitals);

module.exports = router;

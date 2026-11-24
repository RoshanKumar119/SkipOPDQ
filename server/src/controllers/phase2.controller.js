/**
 * Placeholders for features planned in Phase 2.
 * They intentionally return HTTP 501 so nothing is faked as working.
 */
const notImplemented = (feature) => (req, res) =>
  res.status(501).json({ message: `Not Implemented Yet – ${feature} is planned for Phase 2`, feature, phase: 2 });

// TODO: Phase 2 – SMS / WhatsApp alerts via an SMS gateway + WhatsApp Business API
exports.subscribeAlerts = notImplemented('SMS / WhatsApp notifications');
// TODO: Phase 2 – per-patient notification preferences (SMS, WhatsApp, e-mail)
exports.notificationSettings = notImplemented('Notification settings');

// TODO: Phase 2 – real analytics (peak hours, doctor load, waiting-time trends) via aggregation pipelines
exports.analytics = notImplemented('Advanced analytics');

// TODO: Phase 2 – Razorpay/UPI payment for priority booking fee
exports.priorityBooking = notImplemented('Online payment / priority booking');

// TODO: Phase 2 – ABHA ID linking through ABDM sandbox APIs
exports.linkAbha = notImplemented('ABHA / ABDM integration');

// TODO: Phase 2 – full-screen TV token display board for waiting areas
exports.displayBoard = notImplemented('TV token display board');

// TODO: Phase 2 – multi-hospital (multi-tenant) support
exports.hospitals = notImplemented('Multi-hospital support');

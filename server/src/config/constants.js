/**
 * App-wide constants. SkipOPDQ currently supports a single hospital
 * (multi-hospital support is planned for Phase 2).
 */
module.exports = {
  HOSPITAL: {
    name: 'City Care Multispeciality Hospital (Demo)',
    city: 'Pune, Maharashtra',
    helpline: '+91 20 4000 1234',
  },
  ROLES: ['patient', 'doctor', 'admin'],
  DOCTOR_STATUSES: ['available', 'busy', 'unavailable'],
  APPOINTMENT_STATUSES: ['waiting', 'in-consultation', 'completed', 'skipped', 'cancelled'],
  ALLOWED_DELAYS: [0, 10, 15, 30],
  // Default password given to doctor accounts created by the admin
  DEFAULT_DOCTOR_PASSWORD: 'doctor123',
  // Buffer (minutes) used for "Reach the OPD by" suggestion
  ARRIVAL_BUFFER_MINUTES: 10,
};

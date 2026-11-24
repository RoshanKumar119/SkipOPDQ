const mongoose = require('mongoose');

/**
 * OPD appointment / token. Token numbers auto-increment per doctor per day,
 * and online and walk-in patients share the same token sequence.
 */
const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // empty for walk-ins without an account
    patientName: { type: String, required: true, trim: true }, // snapshot (also used for walk-ins)
    patientPhone: { type: String, trim: true, default: '' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD (local)
    tokenNumber: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['waiting', 'in-consultation', 'completed', 'skipped', 'cancelled'],
      default: 'waiting',
    },
    source: { type: String, enum: ['online', 'walk-in'], default: 'online' },
    calledAt: Date,
    completedAt: Date,
    // Cancellation / rescheduling
    cancelledAt: Date,
    cancelledBy: { type: String, enum: ['patient', 'admin'] },
    cancelReason: { type: String, trim: true, maxlength: 200, default: '' },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    rescheduledTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  },
  { timestamps: true }
);

// One token number per doctor per day
appointmentSchema.index({ doctor: 1, date: 1, tokenNumber: 1 }, { unique: true });
appointmentSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

const mongoose = require('mongoose');

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:mm (24h)

/** Weekly OPD session for a doctor. A doctor can have several sessions per day (morning/evening). */
const scheduleSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
    startTime: { type: String, required: true, match: [TIME_RE, 'Start time must be HH:mm'] },
    endTime: { type: String, required: true, match: [TIME_RE, 'End time must be HH:mm'] },
    maxPatients: { type: Number, min: 1, max: 200, default: 30 },
  },
  { timestamps: true }
);

scheduleSchema.pre('validate', function checkTimes() {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    this.invalidate('endTime', 'End time must be after start time');
  }
});

module.exports = mongoose.model('Schedule', scheduleSchema);

const mongoose = require('mongoose');

/**
 * Doctor profile. Login credentials live in the linked User document (role: doctor).
 * `status`, `delayMinutes` and `statusNote` are updated live by the doctor.
 */
const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: [true, 'Department is required'] },
    specialization: { type: String, required: [true, 'Specialization is required'], trim: true },
    qualification: { type: String, trim: true, default: '' },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    roomNumber: { type: String, trim: true, default: '' },
    avgConsultationMinutes: { type: Number, min: 3, max: 60, default: 10 },
    status: { type: String, enum: ['available', 'busy', 'unavailable'], default: 'available' },
    delayMinutes: { type: Number, min: 0, max: 240, default: 0 },
    statusNote: { type: String, trim: true, default: '', maxlength: 120 },
    statusUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);

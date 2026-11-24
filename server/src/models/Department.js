const mongoose = require('mongoose');

/** Hospital department, e.g. General Medicine, Cardiology. */
const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Department name is required'], unique: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, default: '', maxlength: 300 },
    location: { type: String, trim: true, default: '', maxlength: 80 }, // floor / wing
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);

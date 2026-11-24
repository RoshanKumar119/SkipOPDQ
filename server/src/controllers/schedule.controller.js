const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const { ensureDoctor } = require('./doctor.controller');
const { ApiError, asyncHandler } = require('../utils/errors');
const { timeToMinutes } = require('../utils/date');
const { broadcastDoctorStatus } = require('../socket');

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateSession({ dayOfWeek, startTime, endTime, maxPatients }) {
  const day = Number(dayOfWeek);
  if (!Number.isInteger(day) || day < 0 || day > 6) throw new ApiError(400, 'Please select a valid day');
  if (!TIME_RE.test(startTime || '') || !TIME_RE.test(endTime || '')) throw new ApiError(400, 'Times must be in HH:mm format');
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) throw new ApiError(400, 'End time must be after start time');
  const max = maxPatients === undefined || maxPatients === '' ? 30 : Number(maxPatients);
  if (!Number.isInteger(max) || max < 1 || max > 200) throw new ApiError(400, 'Max patients must be between 1 and 200');
  return { dayOfWeek: day, startTime, endTime, maxPatients: max };
}

/** Reject sessions that overlap with another session of the same doctor on the same day. */
async function assertNoOverlap(doctorId, session, excludeId) {
  const sameDay = await Schedule.find({ doctor: doctorId, dayOfWeek: session.dayOfWeek, _id: { $ne: excludeId } }).lean();
  const s = timeToMinutes(session.startTime);
  const e = timeToMinutes(session.endTime);
  const clash = sameDay.find((o) => s < timeToMinutes(o.endTime) && timeToMinutes(o.startTime) < e);
  if (clash) throw new ApiError(409, `Overlaps with existing session ${clash.startTime}–${clash.endTime}`);
}

/** GET /api/schedules?doctor=<id> */
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.doctor) {
    if (!mongoose.isValidObjectId(req.query.doctor)) throw new ApiError(400, 'Invalid doctor');
    filter.doctor = req.query.doctor;
  }
  const schedules = await Schedule.find(filter).sort({ dayOfWeek: 1, startTime: 1 }).lean();
  res.json(schedules);
});

/** POST /api/schedules (admin) */
exports.create = asyncHandler(async (req, res) => {
  const doctor = await ensureDoctor(req.body?.doctor);
  const session = validateSession(req.body || {});
  await assertNoOverlap(doctor._id, session);
  const schedule = await Schedule.create({ doctor: doctor._id, ...session });
  broadcastDoctorStatus(doctor._id); // today's timing may have changed
  res.status(201).json(schedule);
});

/** PUT /api/schedules/:id (admin) */
exports.update = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  const session = validateSession({ ...schedule.toObject(), ...req.body });
  await assertNoOverlap(schedule.doctor, session, schedule._id);
  Object.assign(schedule, session);
  await schedule.save();
  broadcastDoctorStatus(schedule.doctor);
  res.json(schedule);
});

/** DELETE /api/schedules/:id (admin) – remove a weekly session. */
exports.remove = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findByIdAndDelete(req.params.id);
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  broadcastDoctorStatus(schedule.doctor);
  res.json({ message: 'Session removed' });
});

const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { ApiError, asyncHandler } = require('../utils/errors');
const { todayStr } = require('../utils/date');
const { getQueueSnapshot } = require('../utils/queueSnapshot');
const { broadcastQueue } = require('../socket');

/** Resolve the Doctor profile of the logged-in doctor user. */
async function myDoctor(req) {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found for this account');
  return doctor;
}

/** Doctor's view of today's queue: snapshot + patient names (private to the doctor). */
async function doctorQueueView(doctorId) {
  const date = todayStr();
  const [snapshot, appointments] = await Promise.all([
    getQueueSnapshot(doctorId, date),
    Appointment.find({ doctor: doctorId, date }).sort({ tokenNumber: 1 }).lean(),
  ]);
  const tokenInfo = new Map(snapshot.tokens.map((t) => [t.appointmentId, t]));
  return {
    ...snapshot,
    appointments: appointments.map((a) => ({
      _id: a._id,
      tokenNumber: a.tokenNumber,
      patientName: a.patientName,
      patientPhone: a.patientPhone,
      source: a.source,
      status: a.status,
      calledAt: a.calledAt,
      completedAt: a.completedAt,
      createdAt: a.createdAt,
      estimatedWaitMinutes: tokenInfo.get(String(a._id))?.estimatedWaitMinutes ?? null,
    })),
  };
}

/** GET /api/queue/:doctorId?date= – public live queue snapshot (no patient names). */
exports.getQueue = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.doctorId)) throw new ApiError(404, 'Doctor not found');
  const snapshot = await getQueueSnapshot(req.params.doctorId, req.query.date || todayStr());
  if (!snapshot) throw new ApiError(404, 'Doctor not found');
  res.json(snapshot);
});

/** GET /api/queue/me/today (doctor) */
exports.myToday = asyncHandler(async (req, res) => {
  const doctor = await myDoctor(req);
  res.json(await doctorQueueView(doctor._id));
});

/**
 * POST /api/queue/me/call-next (doctor)
 * Completes the patient currently in consultation and calls the next waiting token.
 */
exports.callNext = asyncHandler(async (req, res) => {
  const doctor = await myDoctor(req);
  const date = todayStr();
  const now = new Date();

  await Appointment.updateMany(
    { doctor: doctor._id, date, status: 'in-consultation' },
    { $set: { status: 'completed', completedAt: now } }
  );
  const next = await Appointment.findOneAndUpdate(
    { doctor: doctor._id, date, status: 'waiting' },
    { $set: { status: 'in-consultation', calledAt: now } },
    { sort: { tokenNumber: 1 }, new: true }
  );

  broadcastQueue(doctor._id, date); // live update for every patient in this queue
  res.json({
    message: next ? `Calling token #${next.tokenNumber} – ${next.patientName}` : 'No more patients waiting. Queue is clear!',
    queue: await doctorQueueView(doctor._id),
  });
});

/** POST /api/queue/me/done (doctor) – mark the current patient as completed. */
exports.markDone = asyncHandler(async (req, res) => {
  const doctor = await myDoctor(req);
  const date = todayStr();
  const current = await Appointment.findOneAndUpdate(
    { doctor: doctor._id, date, status: 'in-consultation' },
    { $set: { status: 'completed', completedAt: new Date() } },
    { new: true }
  );
  if (!current) throw new ApiError(400, 'No patient is in consultation right now. Use "Call Next" first.');

  broadcastQueue(doctor._id, date); // live update for every patient in this queue
  res.json({ message: `Token #${current.tokenNumber} marked as done`, queue: await doctorQueueView(doctor._id) });
});

/**
 * POST /api/queue/me/skip (doctor) – mark a patient as no-show.
 * Body: { appointmentId? } – defaults to the patient currently in consultation.
 */
exports.skip = asyncHandler(async (req, res) => {
  const doctor = await myDoctor(req);
  const date = todayStr();
  const { appointmentId } = req.body || {};

  const filter = { doctor: doctor._id, date, status: { $in: ['waiting', 'in-consultation'] } };
  if (appointmentId) {
    if (!mongoose.isValidObjectId(appointmentId)) throw new ApiError(400, 'Invalid appointment');
    filter._id = appointmentId;
  } else {
    filter.status = 'in-consultation';
  }

  const skipped = await Appointment.findOneAndUpdate(filter, { $set: { status: 'skipped', completedAt: new Date() } }, { new: true });
  if (!skipped) throw new ApiError(400, appointmentId ? 'This token can no longer be skipped' : 'No patient is in consultation to skip');

  broadcastQueue(doctor._id, date); // live update for every patient in this queue
  res.json({ message: `Token #${skipped.tokenNumber} marked as no-show`, queue: await doctorQueueView(doctor._id) });
});

exports.doctorQueueView = doctorQueueView;

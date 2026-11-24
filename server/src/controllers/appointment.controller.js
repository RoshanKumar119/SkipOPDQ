const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Schedule = require('../models/Schedule');
const { ApiError, asyncHandler } = require('../utils/errors');
const { todayStr } = require('../utils/date');
const { createWithNextToken } = require('../utils/token');
const { getQueueSnapshot } = require('../utils/queueSnapshot');
const { broadcastQueue } = require('../socket');

const PHONE_RE = /^[6-9]\d{9}$/;
const ACTIVE = ['waiting', 'in-consultation'];

/**
 * Checks shared by online booking and walk-ins:
 * doctor exists, is not unavailable, has OPD today and is not fully booked.
 */
async function assertBookable(doctorId) {
  if (!mongoose.isValidObjectId(doctorId)) throw new ApiError(400, 'Please select a valid doctor');
  const doctor = await Doctor.findById(doctorId).populate('user', 'name');
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  if (doctor.status === 'unavailable') {
    throw new ApiError(400, `${doctor.user.name} is currently unavailable${doctor.statusNote ? ` (${doctor.statusNote})` : ''}. Booking is closed.`);
  }

  const date = todayStr();
  const sessions = await Schedule.find({ doctor: doctorId, dayOfWeek: new Date().getDay() }).lean();
  if (!sessions.length) throw new ApiError(400, `${doctor.user.name} has no OPD scheduled today`);

  // NOTE: booking stays open for the whole day so the project demo works at any time.
  const capacity = sessions.reduce((sum, s) => sum + (s.maxPatients || 0), 0);
  const booked = await Appointment.countDocuments({ doctor: doctorId, date, status: { $ne: 'cancelled' } });
  if (booked >= capacity) throw new ApiError(400, `Today's OPD for ${doctor.user.name} is fully booked (${capacity} tokens)`);

  return { doctor, date };
}

/** POST /api/appointments – patient books a token for today. */
exports.book = asyncHandler(async (req, res) => {
  const { doctorId } = req.body || {};
  const { doctor, date } = await assertBookable(doctorId);

  const duplicate = await Appointment.findOne({ patient: req.user._id, doctor: doctor._id, date, status: { $in: ACTIVE } });
  if (duplicate) {
    throw new ApiError(409, `You already have token #${duplicate.tokenNumber} with ${doctor.user.name} today`);
  }

  const appointment = await createWithNextToken({
    patient: req.user._id,
    patientName: req.user.name,
    patientPhone: req.user.phone,
    doctor: doctor._id,
    date,
    source: 'online',
  });

  broadcastQueue(doctor._id, date);
  res.status(201).json({ appointment, message: `Token #${appointment.tokenNumber} booked with ${doctor.user.name}` });
});

/** GET /api/appointments/my – logged-in patient's appointments (newest first). */
exports.my = asyncHandler(async (req, res) => {
  const list = await Appointment.find({ patient: req.user._id })
    .sort({ date: -1, tokenNumber: -1 })
    .populate('rescheduledTo', 'date tokenNumber')
    .populate({ path: 'doctor', select: 'specialization roomNumber user department', populate: [{ path: 'user', select: 'name' }, { path: 'department', select: 'name' }] })
    .lean();
  res.json(list.map(formatAppointment));
});

/**
 * GET /api/appointments/:id – appointment + live queue snapshot.
 * Accessible by the patient who booked it, the doctor it belongs to, or an admin.
 */
exports.getOne = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Appointment not found');
  const appointment = await Appointment.findById(req.params.id).populate('rescheduledTo', 'date tokenNumber status').lean();
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  const { role, _id } = req.user;
  const isOwner = appointment.patient && String(appointment.patient) === String(_id);
  const isDoctor = role === 'doctor' && (await Doctor.exists({ _id: appointment.doctor, user: _id }));
  if (!isOwner && !isDoctor && role !== 'admin') throw new ApiError(403, 'You cannot view this appointment');

  appointment.isUpcoming = appointment.date > todayStr();
  const queue = await getQueueSnapshot(appointment.doctor, appointment.date);
  res.json({ appointment, queue });
});

/** GET /api/appointments?doctor=&status=&date= (admin) – appointments monitor. */
exports.list = asyncHandler(async (req, res) => {
  const { doctor, status, date = todayStr() } = req.query;
  const filter = { date };
  if (doctor) {
    if (!mongoose.isValidObjectId(doctor)) throw new ApiError(400, 'Invalid doctor');
    filter.doctor = doctor;
  }
  if (status) filter.status = status;

  const list = await Appointment.find(filter)
    .sort({ doctor: 1, tokenNumber: 1 })
    .populate('rescheduledTo', 'date tokenNumber')
    .populate({ path: 'doctor', select: 'specialization roomNumber user department', populate: [{ path: 'user', select: 'name' }, { path: 'department', select: 'name' }] })
    .lean();
  res.json(list.map(formatAppointment));
});

/** POST /api/appointments/walk-in (admin) – add a walk-in patient to today's token queue. */
exports.walkIn = asyncHandler(async (req, res) => {
  const { doctorId, name, phone } = req.body || {};
  if (!name || !name.trim()) throw new ApiError(400, 'Patient name is required');
  const cleanPhone = String(phone || '').replace(/\s+/g, '');
  if (!PHONE_RE.test(cleanPhone)) throw new ApiError(400, 'Please enter a valid 10-digit mobile number');

  const { doctor, date } = await assertBookable(doctorId);
  const appointment = await createWithNextToken({
    patientName: name.trim(),
    patientPhone: cleanPhone,
    doctor: doctor._id,
    date,
    source: 'walk-in',
  });

  broadcastQueue(doctor._id, date);
  res.status(201).json({ appointment, message: `Walk-in token #${appointment.tokenNumber} issued for ${name.trim()} with ${doctor.user.name}` });
});

/** Flatten populated doctor info for the client. */
function formatAppointment(a) {
  const d = a.doctor || {};
  return {
    ...a,
    doctor: d._id
      ? { _id: d._id, name: d.user?.name, specialization: d.specialization, roomNumber: d.roomNumber, department: d.department?.name }
      : null,
  };
}

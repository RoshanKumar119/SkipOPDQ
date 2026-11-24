/**
 * Appointment cancellation & rescheduling.
 *
 * Rules
 * - Only a WAITING token can be cancelled or rescheduled (not one already with the doctor).
 * - Patients can change only their own bookings; admins/reception can change any.
 * - Rescheduling moves the token to another day (today .. today + RESCHEDULE_WINDOW_DAYS)
 *   on which the doctor has OPD. The old appointment is marked "cancelled" and linked
 *   to the new one (rescheduledTo / rescheduledFrom), and the new date gets the next token.
 * - Every change is broadcast so the affected queues update live.
 */
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Schedule = require('../models/Schedule');
const { ApiError, asyncHandler } = require('../utils/errors');
const { todayStr, addDays, dayOfWeekOf, DAY_NAMES } = require('../utils/date');
const { createWithNextToken } = require('../utils/token');
const { broadcastQueue } = require('../socket');

const RESCHEDULE_WINDOW_DAYS = 7;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Load an appointment the current user is allowed to change. */
async function loadChangeable(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Appointment not found');
  const appt = await Appointment.findById(req.params.id);
  if (!appt) throw new ApiError(404, 'Appointment not found');

  const isAdmin = req.user.role === 'admin';
  const isOwner = req.user.role === 'patient' && appt.patient && String(appt.patient) === String(req.user._id);
  if (!isAdmin && !isOwner) throw new ApiError(403, 'You can only change your own appointments');

  if (appt.date < todayStr()) throw new ApiError(400, 'Past appointments cannot be changed');
  if (appt.status === 'in-consultation') throw new ApiError(400, 'This patient is already with the doctor and cannot be changed');
  if (appt.status !== 'waiting') throw new ApiError(400, `This appointment is already ${appt.status}`);
  return { appt, isAdmin };
}

/**
 * For each of the next N days: does the doctor have OPD, and how many tokens are left?
 * Today is only bookable when the doctor is not marked unavailable.
 */
async function dateOptions(doctor, excludeDate) {
  const schedules = await Schedule.find({ doctor: doctor._id }).lean();
  const today = todayStr();
  const dates = Array.from({ length: RESCHEDULE_WINDOW_DAYS + 1 }, (_, i) => addDays(today, i));
  const counts = await Appointment.aggregate([
    { $match: { doctor: doctor._id, date: { $in: dates }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$date', n: { $sum: 1 } } },
  ]);
  const booked = new Map(counts.map((c) => [c._id, c.n]));

  return dates.map((date) => {
    const sessions = schedules
      .filter((s) => s.dayOfWeek === dayOfWeekOf(date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((s) => ({ startTime: s.startTime, endTime: s.endTime, maxPatients: s.maxPatients }));
    const capacity = sessions.reduce((sum, s) => sum + s.maxPatients, 0);
    const taken = booked.get(date) || 0;

    let reason = '';
    if (date === excludeDate) reason = 'Current appointment date';
    else if (!sessions.length) reason = 'No OPD on this day';
    else if (date === today && doctor.status === 'unavailable') reason = 'Doctor unavailable today';
    else if (taken >= capacity) reason = 'Fully booked';

    return {
      date,
      dayName: DAY_NAMES[dayOfWeekOf(date)],
      isToday: date === today,
      sessions,
      capacity,
      booked: taken,
      available: !reason,
      reason,
    };
  });
}

/** PATCH /api/appointments/:id/cancel  body: { reason? } */
exports.cancel = asyncHandler(async (req, res) => {
  const { appt, isAdmin } = await loadChangeable(req);
  const reason = String(req.body?.reason || '').trim().slice(0, 200);

  // Atomic: only cancel if it is still waiting (the doctor may have just called it)
  const updated = await Appointment.findOneAndUpdate(
    { _id: appt._id, status: 'waiting' },
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancelledBy: isAdmin ? 'admin' : 'patient', cancelReason: reason } },
    { new: true }
  );
  if (!updated) throw new ApiError(409, 'The doctor has just called this token – it can no longer be cancelled');

  broadcastQueue(updated.doctor, updated.date);
  res.json({ appointment: updated, message: `Token #${updated.tokenNumber} cancelled` });
});

/** GET /api/appointments/:id/reschedule-options – selectable dates for the reschedule dialog. */
exports.rescheduleOptions = asyncHandler(async (req, res) => {
  const { appt } = await loadChangeable(req);
  const doctor = await Doctor.findById(appt.doctor).populate('user', 'name');
  res.json({
    appointmentId: appt._id,
    currentDate: appt.date,
    doctor: { _id: doctor._id, name: doctor.user.name },
    windowDays: RESCHEDULE_WINDOW_DAYS,
    options: await dateOptions(doctor, appt.date),
  });
});

/** PATCH /api/appointments/:id/reschedule  body: { date: 'YYYY-MM-DD' } */
exports.reschedule = asyncHandler(async (req, res) => {
  const { appt, isAdmin } = await loadChangeable(req);
  const { date } = req.body || {};
  if (!DATE_RE.test(date || '')) throw new ApiError(400, 'Please choose a new date');

  const doctor = await Doctor.findById(appt.doctor).populate('user', 'name');
  const option = (await dateOptions(doctor, appt.date)).find((o) => o.date === date);
  if (!option) throw new ApiError(400, `You can reschedule up to ${RESCHEDULE_WINDOW_DAYS} days ahead`);
  if (!option.available) throw new ApiError(400, `Cannot move to ${option.dayName}, ${date}: ${option.reason}`);

  if (appt.patient) {
    const duplicate = await Appointment.findOne({ patient: appt.patient, doctor: appt.doctor, date, status: { $in: ['waiting', 'in-consultation'] } });
    if (duplicate) throw new ApiError(409, `There is already token #${duplicate.tokenNumber} with ${doctor.user.name} on ${date}`);
  }

  // 1) Release the old token (atomically, in case the doctor calls it right now)
  const old = await Appointment.findOneAndUpdate(
    { _id: appt._id, status: 'waiting' },
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancelledBy: isAdmin ? 'admin' : 'patient', cancelReason: `Rescheduled to ${date}` } },
    { new: true }
  );
  if (!old) throw new ApiError(409, 'The doctor has just called this token – it can no longer be rescheduled');

  // 2) Book the new token on the chosen date
  let fresh;
  try {
    fresh = await createWithNextToken({
      patient: appt.patient,
      patientName: appt.patientName,
      patientPhone: appt.patientPhone,
      doctor: appt.doctor,
      date,
      source: appt.source,
      rescheduledFrom: appt._id,
    });
  } catch (err) {
    // Roll back the cancellation so the patient never loses their token
    await Appointment.updateOne({ _id: appt._id }, { $set: { status: 'waiting' }, $unset: { cancelledAt: 1, cancelledBy: 1, cancelReason: 1 } });
    throw err;
  }
  await Appointment.updateOne({ _id: appt._id }, { $set: { rescheduledTo: fresh._id } });

  broadcastQueue(appt.doctor, appt.date);
  broadcastQueue(appt.doctor, date);
  res.json({
    appointment: fresh,
    previous: { _id: appt._id, date: appt.date, tokenNumber: appt.tokenNumber },
    message: `Moved to ${option.dayName}, ${date} – new token #${fresh.tokenNumber} with ${doctor.user.name}`,
  });
});

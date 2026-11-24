/**
 * Builds the data sent to clients: doctor views (with today's timing and live
 * queue summary) and full queue snapshots. Used by REST controllers and Socket.IO.
 */
const Doctor = require('../models/Doctor');
const Schedule = require('../models/Schedule');
const Appointment = require('../models/Appointment');
const { calculateQueue } = require('./waitTime');
const { todayStr } = require('./date');

const initials = (name = '') =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Shape a populated Doctor document for the API. */
function formatDoctor(doc, { sessionsToday = [], queue = null, weeklySchedule = null } = {}) {
  const user = doc.user || {};
  const dept = doc.department || {};
  const view = {
    _id: String(doc._id),
    userId: user._id ? String(user._id) : undefined,
    name: user.name,
    email: user.email,
    phone: user.phone,
    initials: initials(user.name),
    department: dept._id ? { _id: String(dept._id), name: dept.name, location: dept.location } : null,
    specialization: doc.specialization,
    qualification: doc.qualification,
    experienceYears: doc.experienceYears,
    roomNumber: doc.roomNumber,
    avgConsultationMinutes: doc.avgConsultationMinutes,
    status: doc.status,
    delayMinutes: doc.delayMinutes,
    statusNote: doc.statusNote,
    statusUpdatedAt: doc.statusUpdatedAt,
    todaySessions: sessionsToday
      .map((s) => ({ startTime: s.startTime, endTime: s.endTime, maxPatients: s.maxPatients }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    scheduledToday: sessionsToday.length > 0,
  };
  if (queue) {
    view.queue = {
      nowServing: queue.nowServing,
      waiting: queue.counts.waiting,
      total: queue.counts.total,
      completed: queue.counts.completed,
    };
  }
  if (weeklySchedule) view.weeklySchedule = weeklySchedule;
  return view;
}

/**
 * Load doctors (optionally filtered) together with today's sessions and live queue summary.
 * Uses three queries in total regardless of the number of doctors.
 */
async function getDoctorViews(filter = {}) {
  const date = todayStr();
  const day = new Date().getDay();
  const doctors = await Doctor.find(filter).populate('user', 'name email phone').populate('department', 'name location');
  const ids = doctors.map((d) => d._id);

  const [sessions, appointments] = await Promise.all([
    Schedule.find({ doctor: { $in: ids }, dayOfWeek: day }).lean(),
    Appointment.find({ doctor: { $in: ids }, date }).lean(),
  ]);

  return doctors.map((doc) => {
    const id = String(doc._id);
    const mySessions = sessions.filter((s) => String(s.doctor) === id);
    const myAppointments = appointments.filter((a) => String(a.doctor) === id);
    const queue = calculateQueue(doc, myAppointments, mySessions);
    return formatDoctor(doc, { sessionsToday: mySessions, queue });
  });
}

/** Single doctor view, optionally with the full weekly schedule. */
async function getDoctorView(doctorId, { withWeekly = false } = {}) {
  const [view] = await getDoctorViews({ _id: doctorId });
  if (!view) return null;
  if (withWeekly) {
    const weekly = await Schedule.find({ doctor: doctorId }).sort({ dayOfWeek: 1, startTime: 1 }).lean();
    view.weeklySchedule = weekly.map((s) => ({
      _id: String(s._id),
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      maxPatients: s.maxPatients,
    }));
  }
  return view;
}

/**
 * Full live queue snapshot for a doctor on a date (patient names are NOT included,
 * so it is safe to broadcast to every patient in the queue room).
 */
async function getQueueSnapshot(doctorId, date = todayStr()) {
  const doctor = await Doctor.findById(doctorId).populate('user', 'name').populate('department', 'name location');
  if (!doctor) return null;
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const [sessions, appointments] = await Promise.all([
    Schedule.find({ doctor: doctorId, dayOfWeek }).lean(),
    Appointment.find({ doctor: doctorId, date }).lean(),
  ]);
  const queue = calculateQueue(doctor, appointments, date === todayStr() ? sessions : []);
  return {
    doctorId: String(doctorId),
    date,
    doctor: formatDoctor(doctor, { sessionsToday: sessions }),
    ...queue,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { formatDoctor, getDoctorViews, getDoctorView, getQueueSnapshot, initials };

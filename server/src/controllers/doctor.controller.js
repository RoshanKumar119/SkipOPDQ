const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const { ApiError, asyncHandler } = require('../utils/errors');
const { getDoctorViews, getDoctorView } = require('../utils/queueSnapshot');
const { DEFAULT_DOCTOR_PASSWORD, DOCTOR_STATUSES, ALLOWED_DELAYS } = require('../config/constants');
const { broadcastDoctorStatus } = require('../socket');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/doctors?search=&department=&specialization=
 * Public: doctor cards with live status and queue summary.
 */
exports.list = asyncHandler(async (req, res) => {
  const { search = '', department = '', specialization = '' } = req.query;
  const filter = {};
  if (department) {
    if (!mongoose.isValidObjectId(department)) throw new ApiError(400, 'Invalid department');
    filter.department = department;
  }
  if (specialization) filter.specialization = new RegExp(`^${escapeRegex(specialization)}$`, 'i');

  let doctors = await getDoctorViews(filter);

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    doctors = doctors.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.department?.name?.toLowerCase().includes(q)
    );
  }

  // Available doctors first, then busy, then unavailable; alphabetical inside each group
  const order = { available: 0, busy: 1, unavailable: 2 };
  doctors.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
  res.json(doctors);
});

/** GET /api/doctors/specializations – distinct list for the filter dropdown. */
exports.specializations = asyncHandler(async (req, res) => {
  const list = await Doctor.distinct('specialization');
  res.json(list.sort());
});

/** GET /api/doctors/:id – public doctor details with weekly schedule. */
exports.getOne = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Doctor not found');
  const doctor = await getDoctorView(req.params.id, { withWeekly: true });
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  res.json(doctor);
});

/** GET /api/doctors/me – logged-in doctor's own profile. */
exports.me = asyncHandler(async (req, res) => {
  const doc = await Doctor.findOne({ user: req.user._id });
  if (!doc) throw new ApiError(404, 'Doctor profile not found for this account');
  res.json(await getDoctorView(doc._id, { withWeekly: true }));
});

/**
 * PATCH /api/doctors/me/status – doctor updates live status, delay and note.
 * Body: { status?, delayMinutes?, statusNote? }. Broadcast instantly to patients.
 */
exports.updateMyStatus = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found for this account');

  const { status, delayMinutes, statusNote } = req.body || {};
  if (status !== undefined) {
    if (!DOCTOR_STATUSES.includes(status)) throw new ApiError(400, 'Status must be available, busy or unavailable');
    // A note belongs to a specific status (e.g. "In surgery"), so clear it on change unless a new one is sent
    if (status !== doctor.status && statusNote === undefined) doctor.statusNote = '';
    doctor.status = status;
  }
  if (delayMinutes !== undefined) {
    const delay = Number(delayMinutes);
    if (!ALLOWED_DELAYS.includes(delay)) throw new ApiError(400, `Delay must be one of ${ALLOWED_DELAYS.join(', ')} minutes`);
    doctor.delayMinutes = delay;
  }
  if (statusNote !== undefined) {
    const note = String(statusNote).trim();
    if (note.length > 120) throw new ApiError(400, 'Status note must be 120 characters or less');
    doctor.statusNote = note;
  }
  doctor.statusUpdatedAt = new Date();
  await doctor.save();

  broadcastDoctorStatus(doctor._id);
  res.json(await getDoctorView(doctor._id, { withWeekly: true }));
});

// ---------- Admin ----------

const DOCTOR_FIELDS = ['specialization', 'qualification', 'experienceYears', 'roomNumber', 'avgConsultationMinutes'];

function pickDoctorFields(body) {
  const data = {};
  DOCTOR_FIELDS.forEach((f) => {
    if (body[f] !== undefined && body[f] !== '') data[f] = typeof body[f] === 'string' ? body[f].trim() : body[f];
  });
  if (data.experienceYears !== undefined) data.experienceYears = Number(data.experienceYears);
  if (data.avgConsultationMinutes !== undefined) data.avgConsultationMinutes = Number(data.avgConsultationMinutes);
  return data;
}

async function assertDepartment(id) {
  if (!id || !mongoose.isValidObjectId(id) || !(await Department.exists({ _id: id }))) {
    throw new ApiError(400, 'Please select a valid department');
  }
}

/**
 * POST /api/doctors (admin)
 * Creates the doctor's login account (role: doctor, default password) and profile.
 */
exports.create = asyncHandler(async (req, res) => {
  const { name, email, phone = '', department } = req.body || {};
  if (!name || !name.trim()) throw new ApiError(400, 'Doctor name is required');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new ApiError(400, 'A valid email is required');
  if (!req.body.specialization) throw new ApiError(400, 'Specialization is required');
  await assertDepartment(department);
  if (await User.exists({ email: email.toLowerCase().trim() })) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const fullName = /^dr\.?\s/i.test(name.trim()) ? name.trim() : `Dr. ${name.trim()}`;
  const user = await User.create({ name: fullName, email, phone, password: DEFAULT_DOCTOR_PASSWORD, role: 'doctor' });
  try {
    const doctor = await Doctor.create({ user: user._id, department, ...pickDoctorFields(req.body) });
    res.status(201).json({
      doctor: await getDoctorView(doctor._id),
      defaultPassword: DEFAULT_DOCTOR_PASSWORD,
      message: `Doctor account created. Login: ${user.email} / ${DEFAULT_DOCTOR_PASSWORD}`,
    });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // keep data consistent if profile creation fails
    throw err;
  }
});

/** PUT /api/doctors/:id (admin) – update profile + account name/phone/email. */
exports.update = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const { name, email, phone, department } = req.body || {};
  if (department !== undefined) {
    await assertDepartment(department);
    doctor.department = department;
  }
  Object.assign(doctor, pickDoctorFields(req.body));
  await doctor.save();

  const userUpdate = {};
  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, 'Doctor name cannot be empty');
    userUpdate.name = name.trim();
  }
  if (phone !== undefined) userUpdate.phone = String(phone).trim();
  if (email !== undefined) {
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError(400, 'A valid email is required');
    userUpdate.email = email.toLowerCase().trim();
  }
  if (Object.keys(userUpdate).length) {
    await User.findByIdAndUpdate(doctor.user, userUpdate, { runValidators: true });
  }

  broadcastDoctorStatus(doctor._id); // e.g. avg. consultation time changes waiting times
  res.json(await getDoctorView(doctor._id, { withWeekly: true }));
});

/** Helper used by schedule controller / seed to verify a doctor exists. */
exports.ensureDoctor = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid doctor');
  const doc = await Doctor.findById(id);
  if (!doc) throw new ApiError(404, 'Doctor not found');
  return doc;
};

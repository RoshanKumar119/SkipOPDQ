/**
 * Demo data seeder for "City Care Multispeciality Hospital (Demo)".
 *
 * - Runs automatically on every start when using the in-memory database.
 * - `npm run seed` re-seeds a real MongoDB (MONGO_URI) – this wipes existing data!
 *
 * All appointments are created for TODAY's date so the queues look alive on demo day.
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Schedule = require('../models/Schedule');
const Appointment = require('../models/Appointment');
const { todayStr, toDateStr } = require('../utils/date');

const DEMO_PASSWORD = 'demo123';

const DEPARTMENTS = [
  { name: 'General Medicine', description: 'Fever, infections, diabetes, BP and general health check-ups.', location: 'Ground Floor, Wing A' },
  { name: 'Orthopaedics', description: 'Bone, joint, spine and sports injury care.', location: '2nd Floor, Wing B' },
  { name: 'Paediatrics', description: 'Child health, vaccination and new-born care.', location: '1st Floor, Wing A' },
  { name: 'Cardiology', description: 'Heart health, ECG, Echo and cardiac consultations.', location: '3rd Floor, Wing C' },
  { name: 'ENT', description: 'Ear, nose and throat disorders, hearing and sinus care.', location: '2nd Floor, Wing A' },
  { name: 'Dermatology', description: 'Skin, hair and nail conditions, allergies.', location: '2nd Floor, Wing C' },
];

// evening: also runs a 17:00–20:00 OPD session
const DOCTORS = [
  { name: 'Dr. Rajesh Sharma', email: 'doctor@skipopdq.demo', phone: '9822012345', dept: 'General Medicine', specialization: 'General Physician', qualification: 'MBBS, MD (General Medicine)', experienceYears: 14, roomNumber: 'OPD-101', avgConsultationMinutes: 10, evening: true },
  { name: 'Dr. Sunita Rao', email: 'sunita.rao@skipopdq.demo', phone: '9822012346', dept: 'General Medicine', specialization: 'Family Physician', qualification: 'MBBS, DNB (Family Medicine)', experienceYears: 8, roomNumber: 'OPD-102', avgConsultationMinutes: 8, evening: false },
  { name: 'Dr. Vikram Singh Rathore', email: 'vikram.rathore@skipopdq.demo', phone: '9822012347', dept: 'Orthopaedics', specialization: 'Orthopaedic Surgeon', qualification: 'MBBS, MS (Orthopaedics)', experienceYears: 18, roomNumber: 'OPD-205', avgConsultationMinutes: 12, evening: true },
  { name: 'Dr. Arjun Deshpande', email: 'arjun.deshpande@skipopdq.demo', phone: '9822012348', dept: 'Orthopaedics', specialization: 'Sports Medicine & Arthroscopy', qualification: 'MBBS, DNB (Orthopaedics)', experienceYears: 6, roomNumber: 'OPD-206', avgConsultationMinutes: 15, evening: false },
  { name: 'Dr. Neha Joshi', email: 'neha.joshi@skipopdq.demo', phone: '9822012349', dept: 'Paediatrics', specialization: 'Paediatrician', qualification: 'MBBS, MD (Paediatrics)', experienceYears: 10, roomNumber: 'OPD-110', avgConsultationMinutes: 10, evening: true },
  { name: 'Dr. Anil Mehta', email: 'anil.mehta@skipopdq.demo', phone: '9822012350', dept: 'Cardiology', specialization: 'Cardiologist', qualification: 'MBBS, MD, DM (Cardiology)', experienceYears: 22, roomNumber: 'OPD-301', avgConsultationMinutes: 15, evening: false,
    status: 'busy', delayMinutes: 30, statusNote: 'In emergency procedure at Cath Lab' },
  { name: 'Dr. Meera Iyer', email: 'meera.iyer@skipopdq.demo', phone: '9822012351', dept: 'Cardiology', specialization: 'Non-invasive Cardiologist', qualification: 'MBBS, MD (Medicine), DM (Cardiology)', experienceYears: 11, roomNumber: 'OPD-302', avgConsultationMinutes: 12, evening: true },
  { name: 'Dr. Farhan Qureshi', email: 'farhan.qureshi@skipopdq.demo', phone: '9822012352', dept: 'ENT', specialization: 'ENT Specialist', qualification: 'MBBS, MS (ENT)', experienceYears: 9, roomNumber: 'OPD-208', avgConsultationMinutes: 10, evening: true },
  { name: 'Dr. Kavita Nair', email: 'kavita.nair@skipopdq.demo', phone: '9822012353', dept: 'Dermatology', specialization: 'Dermatologist', qualification: 'MBBS, MD (Dermatology)', experienceYears: 12, roomNumber: 'OPD-212', avgConsultationMinutes: 12, evening: false,
    status: 'unavailable', statusNote: 'On leave today' },
];

const PATIENTS = [
  { name: 'Amit Verma', email: 'patient@skipopdq.demo', phone: '9876543210' },
  { name: 'Priya Kulkarni', email: 'priya.kulkarni@example.com', phone: '9876543211' },
  { name: 'Rohan Patil', email: 'rohan.patil@example.com', phone: '9876543212' },
  { name: 'Sneha Gupta', email: 'sneha.gupta@example.com', phone: '9876543213' },
  { name: 'Mohammed Irfan', email: 'mohammed.irfan@example.com', phone: '9876543214' },
];

const minutesAgo = (m) => new Date(Date.now() - m * 60000);

async function seedDatabase({ log = console.log } = {}) {
  const today = todayStr();

  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Doctor.deleteMany({}),
    Schedule.deleteMany({}),
    Appointment.deleteMany({}),
  ]);
  await Appointment.syncIndexes();

  // All demo accounts share the same password, so hash it once
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---- Departments
  const departments = await Department.insertMany(DEPARTMENTS);
  const deptId = Object.fromEntries(departments.map((d) => [d.name, d._id]));

  // ---- Admin + patients
  await User.insertMany([
    { name: 'Reception Admin', email: 'admin@skipopdq.demo', phone: '9822000000', password: hash, role: 'admin' },
  ]);
  const patients = await User.insertMany(PATIENTS.map((p) => ({ ...p, password: hash, role: 'patient' })));
  const patient = Object.fromEntries(patients.map((p) => [p.name, p]));

  // ---- Doctors (user account + profile) and weekly schedules
  const doctorUsers = await User.insertMany(
    DOCTORS.map((d) => ({ name: d.name, email: d.email, phone: d.phone, password: hash, role: 'doctor' }))
  );
  const doctors = await Doctor.insertMany(
    DOCTORS.map((d, i) => ({
      user: doctorUsers[i]._id,
      department: deptId[d.dept],
      specialization: d.specialization,
      qualification: d.qualification,
      experienceYears: d.experienceYears,
      roomNumber: d.roomNumber,
      avgConsultationMinutes: d.avgConsultationMinutes,
      status: d.status || 'available',
      delayMinutes: d.delayMinutes || 0,
      statusNote: d.statusNote || '',
    }))
  );
  const doctor = Object.fromEntries(doctors.map((doc, i) => [DOCTORS[i].name, doc]));

  // Every doctor has a morning OPD every day (so the demo works on any day);
  // some also run an evening OPD.
  const schedules = [];
  DOCTORS.forEach((d, i) => {
    for (let day = 0; day <= 6; day += 1) {
      schedules.push({ doctor: doctors[i]._id, dayOfWeek: day, startTime: '09:00', endTime: '13:00', maxPatients: 30 });
      if (d.evening) schedules.push({ doctor: doctors[i]._id, dayOfWeek: day, startTime: '17:00', endTime: '20:00', maxPatients: 20 });
    }
  });
  await Schedule.insertMany(schedules);

  // ---- Today's appointments (so queues look alive)
  const appt = (doc, token, status, p, extra = {}) => ({
    doctor: doc._id,
    date: today,
    tokenNumber: token,
    status,
    source: p.walkIn ? 'walk-in' : 'online',
    patient: p.walkIn ? undefined : p._id,
    patientName: p.name,
    patientPhone: p.phone,
    ...extra,
  });
  const sharma = doctor['Dr. Rajesh Sharma'];
  const joshi = doctor['Dr. Neha Joshi'];
  const rathore = doctor['Dr. Vikram Singh Rathore'];

  await Appointment.insertMany([
    // Dr. Rajesh Sharma – demo doctor with a live queue; demo patient Amit has token 6
    appt(sharma, 1, 'completed', patient['Priya Kulkarni'], { calledAt: minutesAgo(35), completedAt: minutesAgo(25) }),
    appt(sharma, 2, 'completed', patient['Rohan Patil'], { calledAt: minutesAgo(25), completedAt: minutesAgo(14) }),
    appt(sharma, 3, 'in-consultation', patient['Sneha Gupta'], { calledAt: minutesAgo(4) }),
    appt(sharma, 4, 'waiting', { walkIn: true, name: 'Lakshmi Bai', phone: '9850011122' }),
    appt(sharma, 5, 'waiting', patient['Mohammed Irfan']),
    appt(sharma, 6, 'waiting', patient['Amit Verma']),
    // Dr. Neha Joshi – Paediatrics
    appt(joshi, 1, 'completed', patient['Priya Kulkarni'], { calledAt: minutesAgo(30), completedAt: minutesAgo(18) }),
    appt(joshi, 2, 'in-consultation', { walkIn: true, name: 'Suresh Pawar', phone: '9850033344' }, { calledAt: minutesAgo(6) }),
    // Dr. Vikram Singh Rathore – Orthopaedics
    appt(rathore, 1, 'waiting', patient['Rohan Patil']),
  ]);

  // A past visit so "My Appointments" also shows history for the demo patient
  const past = new Date();
  past.setDate(past.getDate() - 6);
  await Appointment.create({
    doctor: doctor['Dr. Farhan Qureshi']._id,
    date: toDateStr(past),
    tokenNumber: 3,
    status: 'completed',
    source: 'online',
    patient: patient['Amit Verma']._id,
    patientName: 'Amit Verma',
    patientPhone: '9876543210',
  });

  log(`[seed] Seeded ${departments.length} departments, ${doctors.length} doctors, ${patients.length} patients, today's queues for ${today}`);
  log('[seed] Demo logins (password demo123): admin@skipopdq.demo | doctor@skipopdq.demo | patient@skipopdq.demo');
}

module.exports = { seedDatabase };

// ---- CLI: `npm run seed`
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    if (!process.env.MONGO_URI) {
      console.log('[seed] MONGO_URI is not set – the in-memory database is seeded automatically every time the server starts (npm run dev).');
      console.log('[seed] Set MONGO_URI in server/.env to seed a persistent MongoDB instead.');
      return;
    }
    await connectDB();
    await seedDatabase();
    await disconnectDB();
  })().catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}

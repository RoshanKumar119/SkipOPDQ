const { asyncHandler } = require('../utils/errors');
const { getDoctorViews } = require('../utils/queueSnapshot');
const { todayStr } = require('../utils/date');
const { HOSPITAL } = require('../config/constants');

/** Summary numbers derived from doctor views (also recomputed live on the client). */
function summarize(doctors) {
  return {
    totalDoctors: doctors.length,
    availableNow: doctors.filter((d) => d.status === 'available').length,
    busyNow: doctors.filter((d) => d.status === 'busy').length,
    unavailableNow: doctors.filter((d) => d.status === 'unavailable').length,
    todaysAppointments: doctors.reduce((s, d) => s + (d.queue?.total || 0), 0),
    waitingNow: doctors.reduce((s, d) => s + (d.queue?.waiting || 0), 0),
    completedToday: doctors.reduce((s, d) => s + (d.queue?.completed || 0), 0),
  };
}

/** GET /api/admin/stats – dashboard cards + live table of all doctors. */
exports.stats = asyncHandler(async (req, res) => {
  const doctors = await getDoctorViews();
  doctors.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ date: todayStr(), hospital: HOSPITAL, stats: summarize(doctors), doctors });
});

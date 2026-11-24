/**
 * Date helpers. All OPD dates are stored as local "YYYY-MM-DD" strings so
 * that "today" matches the hospital's local day (not UTC).
 */
const pad = (n) => String(n).padStart(2, '0');

/** Local date string YYYY-MM-DD for the given date (default: now). */
function toDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const todayStr = () => toDateStr(new Date());

/** "HH:mm" -> minutes since midnight */
function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

/** Date object for today at the given "HH:mm" (local time). */
function todayAt(hhmm, base = new Date()) {
  const d = new Date(base);
  const mins = timeToMinutes(hhmm);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d;
}

/** "YYYY-MM-DD" + n days -> "YYYY-MM-DD" (local) */
function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/** Day of week (0 = Sunday) for a "YYYY-MM-DD" string */
const dayOfWeekOf = (dateStr) => new Date(`${dateStr}T00:00:00`).getDay();

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

module.exports = { toDateStr, todayStr, timeToMinutes, todayAt, addDays, dayOfWeekOf, DAY_NAMES };

/** Formatting helpers shared across pages. */

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "17:30" -> "5:30 PM" */
export function time12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** ISO/Date -> "11:40 AM" */
export function clock(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
}

/** "2026-11-24" -> "Tue, 24 Nov 2026" */
export function prettyDate(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/** Sessions -> "9:00 AM – 1:00 PM, 5:00 PM – 8:00 PM" */
export function sessionsText(sessions = []) {
  if (!sessions.length) return 'No OPD today';
  return sessions.map((s) => `${time12(s.startTime)} – ${time12(s.endTime)}`).join(', ');
}

/** 75 -> "1 hr 15 min" */
export function duration(mins) {
  if (mins === null || mins === undefined) return '—';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** Local YYYY-MM-DD */
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

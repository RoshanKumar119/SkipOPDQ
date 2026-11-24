/** Live doctor status badge: green Available / amber Busy / red Unavailable. */
const DOCTOR_STYLES = {
  available: { label: 'Available', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  busy: { label: 'Busy', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  unavailable: { label: 'Unavailable', cls: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const s = DOCTOR_STYLES[status] || DOCTOR_STYLES.unavailable;
  const sizing = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${s.cls} ${sizing}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/** Appointment status pill */
const APPT_STYLES = {
  waiting: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'in-consultation': 'bg-primary-50 text-primary-700 ring-primary-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  skipped: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};
const APPT_LABELS = {
  waiting: 'Waiting',
  'in-consultation': 'In Consultation',
  completed: 'Completed',
  skipped: 'Skipped (No-show)',
  cancelled: 'Cancelled',
};

export function AppointmentStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${APPT_STYLES[status] || APPT_STYLES.cancelled}`}>
      {APPT_LABELS[status] || status}
    </span>
  );
}

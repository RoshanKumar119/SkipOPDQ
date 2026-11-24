import { CheckCircle2, Clock3, Loader2 } from 'lucide-react';

/**
 * Development progress page for the college project presentation.
 * Status keys: done ✅, progress 🔄, planned ⏳ (Phase 2)
 */
const OVERALL = 65;

const MODULES = [
  {
    name: 'Common & Authentication',
    items: [
      ['Landing page (problem, 4-step flow)', 'done'],
      ['Patient registration & JWT login', 'done'],
      ['Role-based redirects & protected routes', 'done'],
      ['One-click demo logins', 'done'],
    ],
  },
  {
    name: 'Patient Module',
    items: [
      ['Find doctors – search & filters with live status', 'done'],
      ['Doctor details with weekly OPD schedule', 'done'],
      ['Book token for today (duplicate prevention)', 'done'],
      ['My Appointments', 'done'],
      ['Live Queue: now serving, patients ahead, waiting time, arrival time', 'done'],
      ['In-app "turn approaching" notifications', 'done'],
      ['SMS / WhatsApp notifications', 'planned'],
      ['Appointment cancellation & rescheduling (patient + reception)', 'done'],
      ['ABHA / ABDM health ID linking', 'planned'],
      ['Online payment / priority booking', 'planned'],
    ],
  },
  {
    name: 'Doctor Module',
    items: [
      ['One-tap status: Available / Busy / Unavailable + delay & note', 'done'],
      ["Today's queue with summary cards", 'done'],
      ['Call Next / Mark Done / Skip (no-show)', 'done'],
    ],
  },
  {
    name: 'Admin Module',
    items: [
      ['Live dashboard (cards + doctor status table)', 'done'],
      ['Manage departments', 'done'],
      ['Manage doctors (auto login account)', 'done'],
      ['Weekly OPD schedules', 'done'],
      ['Appointments monitor with filters', 'done'],
      ['Walk-in patients in the same token queue', 'done'],
      ['Advanced analytics (UI preview with sample data)', 'progress'],
      ['TV token display board for waiting areas', 'planned'],
      ['Multi-hospital support', 'planned'],
    ],
  },
  {
    name: 'Platform & Quality',
    items: [
      ['Real-time updates with Socket.IO (rooms per doctor/day)', 'done'],
      ['Waiting-time calculation engine', 'done'],
      ['Demo seed data (always dated today)', 'done'],
      ['Testing & bug fixing', 'progress'],
      ['SkipOPDQ mobile app (Android / iOS)', 'planned'],
    ],
  },
];

const TIMELINE = [
  ['Requirement Analysis', 'done'],
  ['System Design', 'done'],
  ['Core Development (MVP)', 'done'],
  ['Testing', 'progress'],
  ['Pilot in Partner Hospital', 'planned'],
  ['Launch', 'planned'],
];

const META = {
  done: { emoji: '✅', label: 'Completed', icon: CheckCircle2, cls: 'text-emerald-600', bg: 'bg-emerald-500' },
  progress: { emoji: '🔄', label: 'In Progress', icon: Loader2, cls: 'text-sky-600', bg: 'bg-sky-500' },
  planned: { emoji: '⏳', label: 'Planned (Phase 2)', icon: Clock3, cls: 'text-amber-600', bg: 'bg-slate-300' },
};

export default function Progress() {
  const all = MODULES.flatMap((m) => m.items);
  const count = (s) => all.filter(([, st]) => st === s).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-500">Final Year Project</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">SkipOPDQ – Development Progress</h1>
        <p className="mt-2 text-slate-500">Smart Hospital Doctor Availability &amp; OPD Queue Management Platform</p>
      </div>

      {/* Overall progress */}
      <div className="card mt-8 p-6">
        <div className="mb-2 flex items-end justify-between">
          <p className="font-bold text-slate-900">Overall completion</p>
          <p className="text-3xl font-extrabold text-primary-600">{OVERALL}%</p>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={OVERALL} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600" style={{ width: `${OVERALL}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {['done', 'progress', 'planned'].map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-slate-600">{META[s].emoji} {META[s].label}: <b className="text-slate-900">{count(s)}</b></span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="card mt-6 p-6">
        <h2 className="mb-6 font-bold text-slate-900">Project timeline</h2>
        <ol className="grid gap-4 sm:grid-cols-6">
          {TIMELINE.map(([name, s], i) => (
            <li key={name} className="relative flex items-center gap-3 sm:flex-col sm:text-center">
              {i < TIMELINE.length - 1 && <span className={`absolute left-[19px] top-10 hidden h-0.5 w-full sm:left-1/2 sm:top-5 sm:block ${s === 'done' ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
              <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${s === 'done' ? 'bg-emerald-50' : s === 'progress' ? 'bg-sky-50 ring-2 ring-sky-300' : 'bg-slate-100'}`}>{META[s].emoji}</span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">{name}</span>
                <span className={`text-xs ${META[s].cls}`}>{META[s].label}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Modules */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {MODULES.map((m) => {
          const done = m.items.filter(([, s]) => s === 'done').length;
          return (
            <div key={m.name} className="card p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">{m.name}</h2>
                <span className="text-xs font-semibold text-slate-500">{done}/{m.items.length} done</span>
              </div>
              <ul className="space-y-2">
                {m.items.map(([label, s]) => (
                  <li key={label} className="flex items-start gap-2 text-sm">
                    <span aria-label={META[s].label}>{META[s].emoji}</span>
                    <span className={s === 'planned' ? 'text-slate-500' : 'text-slate-700'}>{label}</span>
                    {s === 'planned' && <span className="ml-auto whitespace-nowrap rounded-full bg-amber-50 px-2 text-[10px] font-semibold text-amber-700">Phase 2</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Summary number card used on dashboards. */
const TONES = {
  primary: 'bg-primary-50 text-primary-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
  coral: 'bg-coral-50 text-coral-600',
  slate: 'bg-slate-100 text-slate-600',
};

export default function StatCard({ label, value, icon: Icon, tone = 'primary', hint }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      {Icon && <div className={`rounded-xl p-3 ${TONES[tone]}`}><Icon size={22} /></div>}
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

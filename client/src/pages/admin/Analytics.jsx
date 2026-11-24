import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FlaskConical } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ComingSoonBadge from '../../components/ComingSoonBadge';

// ---------------------------------------------------------------------------
// SAMPLE DATA ONLY – hard-coded for the UI preview. Real analytics (MongoDB
// aggregation over appointments) are planned for Phase 2.
// ---------------------------------------------------------------------------
const SAMPLE_PEAK_HOURS = [
  { hour: '9 AM', patients: 34 }, { hour: '10 AM', patients: 52 }, { hour: '11 AM', patients: 61 },
  { hour: '12 PM', patients: 44 }, { hour: '1 PM', patients: 18 }, { hour: '5 PM', patients: 29 },
  { hour: '6 PM', patients: 41 }, { hour: '7 PM', patients: 23 },
];
const SAMPLE_DOCTOR_LOAD = [
  { doctor: 'Dr. Sharma', patients: 46 }, { doctor: 'Dr. Rao', patients: 38 }, { doctor: 'Dr. Joshi', patients: 41 },
  { doctor: 'Dr. Rathore', patients: 33 }, { doctor: 'Dr. Iyer', patients: 27 }, { doctor: 'Dr. Qureshi', patients: 30 },
  { doctor: 'Dr. Mehta', patients: 22 },
];
const SAMPLE_WAIT_TREND = [
  { week: 'Wk 1', minutes: 58 }, { week: 'Wk 2', minutes: 52 }, { week: 'Wk 3', minutes: 47 },
  { week: 'Wk 4', minutes: 41 }, { week: 'Wk 5', minutes: 36 }, { week: 'Wk 6', minutes: 31 },
];

const TEAL = '#0B7A75';
const GRID = '#E2E8F0';
const AXIS = { fontSize: 12, fill: '#64748B' };
const tooltipStyle = { borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 };

function ChartCard({ title, caption, children }) {
  return (
    <div className="card p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-slate-900">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Sample data</span>
      </div>
      <p className="mb-4 text-xs text-slate-500">{caption}</p>
      <div className="h-64">{children}</div>
    </div>
  );
}

/** Advanced Analytics – preview with clearly labelled sample data (Phase 2). */
export default function Analytics() {
  return (
    <div>
      <PageHeader title="Analytics" badge={<ComingSoonBadge />} subtitle="OPD insights for hospital management." />

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <FlaskConical className="mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">Preview – Real analytics coming in Phase 2</p>
          <p className="text-sm">The charts below use <b>sample data</b> to show the planned reports. They are not calculated from live hospital data yet.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Peak OPD hours" caption="Average patients arriving per hour (sample data)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SAMPLE_PEAK_HOURS} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="hour" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={tooltipStyle} formatter={(v) => [`${v} patients`, 'Arrivals']} />
              <Bar dataKey="patients" fill={TEAL} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Doctor-wise patient load" caption="Patients seen this week per doctor (sample data)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SAMPLE_DOCTOR_LOAD} layout="vertical" margin={{ top: 0, right: 16, left: 16, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="doctor" tick={AXIS} axisLine={false} tickLine={false} width={80} />
              <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={tooltipStyle} formatter={(v) => [`${v} patients`, 'This week']} />
              <Bar dataKey="patients" fill={TEAL} radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="xl:col-span-2">
          <ChartCard title="Average waiting time trend" caption="Average minutes patients waited inside the hospital, per week since go-live (sample data)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SAMPLE_WAIT_TREND} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="week" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} unit="m" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} min`, 'Avg. wait']} />
                <Line type="monotone" dataKey="minutes" stroke={TEAL} strokeWidth={2} dot={{ r: 4, fill: TEAL, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

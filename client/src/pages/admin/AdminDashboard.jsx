import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, Hourglass, Stethoscope, UserPlus } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import { useHospitalRoom } from '../../context/SocketContext';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LiveIndicator from '../../components/LiveIndicator';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';
import { clock, prettyDate, sessionsText } from '../../utils/format';

/** Live hospital OPD overview. Every number updates through Socket.IO. */
export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [highlight, setHighlight] = useState(null); // doctor row that just changed

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => {
        setDoctors(res.data.doctors);
        setDate(res.data.date);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const flash = (id) => {
    setHighlight(id);
    setTimeout(() => setHighlight((h) => (h === id ? null : h)), 1500);
  };

  useHospitalRoom({
    'doctor:statusChanged': (view) => {
      setDoctors((list) => list.map((d) => (d._id === view._id ? { ...d, ...view } : d)));
      flash(view._id);
    },
    'queue:updated': (snap) => {
      setDoctors((list) =>
        list.map((d) =>
          d._id === snap.doctorId
            ? { ...d, queue: { nowServing: snap.nowServing, waiting: snap.counts.waiting, total: snap.counts.total, completed: snap.counts.completed } }
            : d
        )
      );
      flash(snap.doctorId);
    },
  });

  // Cards are derived from the live doctor list
  const stats = useMemo(() => ({
    total: doctors.length,
    available: doctors.filter((d) => d.status === 'available').length,
    appointments: doctors.reduce((s, d) => s + (d.queue?.total || 0), 0),
    waiting: doctors.reduce((s, d) => s + (d.queue?.waiting || 0), 0),
    completed: doctors.reduce((s, d) => s + (d.queue?.completed || 0), 0),
  }), [doctors]);

  if (loading) return <Loader label="Loading live dashboard..." />;
  if (error) return <EmptyState title="Could not load dashboard" message={error} />;

  return (
    <div>
      <PageHeader
        title="OPD Live Dashboard"
        subtitle={`City Care Multispeciality Hospital (Demo) · ${prettyDate(date)}`}
        actions={<><LiveIndicator /><Link to="/admin/appointments" className="btn-primary"><UserPlus size={16} /> Add Walk-in</Link></>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total doctors" value={stats.total} icon={Stethoscope} tone="primary" />
        <StatCard label="Available right now" value={stats.available} icon={CheckCircle2} tone="emerald" hint={`${stats.total - stats.available} busy / unavailable`} />
        <StatCard label="Today's appointments" value={stats.appointments} icon={CalendarCheck} tone="sky" hint={`${stats.completed} completed`} />
        <StatCard label="Patients waiting now" value={stats.waiting} icon={Hourglass} tone="coral" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Doctors – live status</h2>
          <span className="text-xs text-slate-400">Rows flash when a doctor or queue changes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Doctor</th>
                <th className="table-th">Today&apos;s OPD</th>
                <th className="table-th">Status</th>
                <th className="table-th text-center">Current token</th>
                <th className="table-th text-center">Waiting</th>
                <th className="table-th text-center">Done</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.map((d) => (
                <tr key={d._id} className={`transition-colors duration-700 ${highlight === d._id ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <Avatar name={d.name} initials={d.initials} size="sm" />
                      <div><p className="font-semibold text-slate-900">{d.name}</p><p className="text-xs text-slate-500">{d.department?.name} · Room {d.roomNumber}</p></div>
                    </div>
                  </td>
                  <td className="table-td text-xs text-slate-500">{sessionsText(d.todaySessions)}</td>
                  <td className="table-td">
                    <StatusBadge status={d.status} />
                    {(d.statusNote || d.delayMinutes > 0) && (
                      <p className="mt-1 max-w-[220px] text-xs text-slate-500">
                        {d.statusNote}{d.statusNote && d.delayMinutes > 0 ? ' · ' : ''}{d.delayMinutes > 0 ? `+${d.delayMinutes} min` : ''}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">since {clock(d.statusUpdatedAt)}</p>
                  </td>
                  <td className="table-td text-center">
                    {d.queue?.nowServing ? <span className="rounded-lg bg-primary-50 px-3 py-1 text-base font-bold text-primary-700">#{d.queue.nowServing}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="table-td text-center font-semibold">{d.queue?.waiting ?? 0}</td>
                  <td className="table-td text-center text-slate-500">{d.queue?.completed ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

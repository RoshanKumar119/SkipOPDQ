import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BellRing, CheckCircle2, Clock, Coffee, ListOrdered, PhoneCall, Save, SkipForward, Users, UserX, XCircle,
} from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import { useQueueRoom } from '../../context/SocketContext';
import LiveIndicator from '../../components/LiveIndicator';
import StatCard from '../../components/StatCard';
import StatusBadge, { AppointmentStatusBadge } from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';
import { clock, duration, prettyDate, sessionsText } from '../../utils/format';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', icon: CheckCircle2, active: 'bg-emerald-500 text-white border-emerald-500', idle: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' },
  { value: 'busy', label: 'Busy', icon: Coffee, active: 'bg-amber-500 text-white border-amber-500', idle: 'border-amber-200 text-amber-700 hover:bg-amber-50' },
  { value: 'unavailable', label: 'Unavailable', icon: XCircle, active: 'bg-red-500 text-white border-red-500', idle: 'border-red-200 text-red-700 hover:bg-red-50' },
];
const DELAYS = [0, 10, 15, 30];
const NOTE_SUGGESTIONS = ['In emergency surgery', 'On ward rounds', 'Short break, back soon', 'Attending a meeting', 'On leave today'];

/** Doctor's live status controls + today's queue with Call Next / Mark Done / Skip. */
export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState(null);
  const [queue, setQueue] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');

  const loadQueue = useCallback(() => api.get('/queue/me/today').then((res) => setQueue(res.data)), []);

  useEffect(() => {
    Promise.all([api.get('/doctors/me'), api.get('/queue/me/today')])
      .then(([d, q]) => {
        setDoctor(d.data);
        setNote(d.data.statusNote || '');
        setQueue(q.data);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Live: walk-ins / online bookings added to my queue appear instantly
  useQueueRoom(doctor?._id, queue?.date, {
    'queue:updated': () => loadQueue().catch(() => {}),
  });

  const updateStatus = async (patch, successMsg) => {
    setBusyAction('status');
    try {
      const savedBefore = doctor.statusNote || '';
      const res = await api.patch('/doctors/me/status', patch);
      setDoctor(res.data);
      // Sync the note input with the server, but never wipe a note the doctor is still typing
      const savedNow = res.data.statusNote || '';
      setNote((current) => ('statusNote' in patch || current === savedBefore ? savedNow : current));
      toast.success(successMsg || 'Status updated – patients notified live');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyAction('');
    }
  };

  const queueAction = async (path, body, key) => {
    setBusyAction(key);
    try {
      const res = await api.post(`/queue/me/${path}`, body);
      setQueue(res.data.queue);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyAction('');
    }
  };

  if (loading) return <Loader label="Loading your OPD dashboard..." />;
  if (error || !doctor) return <div className="mx-auto max-w-3xl px-4 py-10"><EmptyState title="Could not load dashboard" message={error} /></div>;

  const current = queue?.appointments.find((a) => a.status === 'in-consultation');
  const nextUp = queue?.appointments.find((a) => a.status === 'waiting');
  const counts = queue?.counts || {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={doctor.name} initials={doctor.initials} size="md" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{doctor.name}</h1>
            <p className="text-sm text-slate-500">{doctor.specialization} · Room {doctor.roomNumber} · {prettyDate(queue?.date)}</p>
            <p className="text-xs text-slate-400">Today&apos;s OPD: {sessionsText(doctor.todaySessions)}</p>
          </div>
        </div>
        <LiveIndicator />
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total today" value={counts.total} icon={ListOrdered} tone="primary" />
        <StatCard label="Completed" value={counts.completed} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Waiting" value={counts.waiting} icon={Users} tone="sky" />
        <StatCard label="Skipped (no-show)" value={counts.skipped} icon={UserX} tone="coral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Live status panel */}
        <div className="card h-fit p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">My live status</h2>
            <StatusBadge status={doctor.status} />
          </div>
          <p className="mt-1 text-xs text-slate-500">One tap – patients see the change instantly.</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map(({ value, label, icon: Icon, active, idle }) => (
              <button key={value} disabled={busyAction === 'status'}
                onClick={() => doctor.status !== value && updateStatus({ status: value }, `You are now ${label}`)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-sm font-semibold transition ${doctor.status === value ? active : idle}`}>
                <Icon size={22} /> {label}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-5 flex items-center gap-1.5 text-sm font-medium text-slate-700"><Clock size={15} /> Running late?</p>
          <div className="grid grid-cols-4 gap-2">
            {DELAYS.map((d) => (
              <button key={d} disabled={busyAction === 'status'}
                onClick={() => doctor.delayMinutes !== d && updateStatus({ delayMinutes: d }, d ? `Delay of ${d} min announced` : 'Delay cleared')}
                className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${doctor.delayMinutes === d ? 'border-primary-500 bg-primary-500 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {d === 0 ? 'On time' : `+${d}m`}
              </button>
            ))}
          </div>

          <form className="mt-5" onSubmit={(e) => { e.preventDefault(); updateStatus({ statusNote: note }, 'Status note updated'); }}>
            <label className="label" htmlFor="note">Status note (optional)</label>
            <div className="flex gap-2">
              <input id="note" className="input" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. In emergency surgery" />
              <button className="btn-primary px-3" disabled={busyAction === 'status' || note === (doctor.statusNote || '')} title="Save note"><Save size={16} /></button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {NOTE_SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => setNote(s)} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200">{s}</button>
              ))}
              {note && <button type="button" onClick={() => setNote('')} className="rounded-full px-2.5 py-1 text-xs text-coral-600 hover:bg-coral-50">Clear</button>}
            </div>
          </form>
        </div>

        <div className="space-y-6">
          {/* Now serving + controls */}
          <div className="card p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className={`flex h-36 w-full shrink-0 flex-col items-center justify-center rounded-2xl md:w-40 ${current ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Now Serving</span>
                <span className="text-6xl font-extrabold">{current ? current.tokenNumber : '—'}</span>
              </div>
              <div className="flex-1">
                {current ? (
                  <>
                    <p className="text-xl font-bold text-slate-900">{current.patientName}</p>
                    <p className="text-sm text-slate-500">{current.source === 'walk-in' ? 'Walk-in' : 'Online'} · {current.patientPhone || 'No phone'} · called at {clock(current.calledAt)}</p>
                  </>
                ) : (
                  <p className="text-lg font-semibold text-slate-600">No patient in consultation</p>
                )}
                <p className="mt-1 text-sm text-slate-500">
                  {nextUp ? <>Next: <b className="text-slate-700">#{nextUp.tokenNumber} {nextUp.patientName}</b></> : 'No patients waiting'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn-primary px-5 py-2.5 text-base" disabled={!!busyAction || (!nextUp && !current)} onClick={() => queueAction('call-next', {}, 'next')}>
                    <PhoneCall size={18} /> {busyAction === 'next' ? 'Calling...' : 'Call Next'}
                  </button>
                  <button className="btn-outline py-2.5" disabled={!!busyAction || !current} onClick={() => queueAction('done', {}, 'done')}>
                    <CheckCircle2 size={18} /> Mark Done
                  </button>
                  <button className="btn py-2.5 border border-coral-500 text-coral-600 hover:bg-coral-50" disabled={!!busyAction || !current} onClick={() => queueAction('skip', {}, 'skip')}>
                    <SkipForward size={18} /> Skip (No-show)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Today's queue */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 font-bold text-slate-900"><BellRing size={18} className="text-primary-500" /> Today&apos;s queue</h2>
              <span className="text-xs text-slate-400">Avg. {doctor.avgConsultationMinutes} min / patient</span>
            </div>
            {!queue?.appointments.length ? (
              <div className="p-6"><EmptyState icon={Users} title="No patients yet" message="Online bookings and walk-ins will appear here instantly." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-th">Token</th>
                      <th className="table-th">Patient</th>
                      <th className="table-th">Source</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Est. wait</th>
                      <th className="table-th" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queue.appointments.map((a) => (
                      <tr key={a._id} className={a.status === 'in-consultation' ? 'bg-emerald-50/60' : a.status === 'completed' || a.status === 'skipped' ? 'opacity-60' : ''}>
                        <td className="table-td font-bold text-primary-700">#{a.tokenNumber}</td>
                        <td className="table-td"><p className="font-medium text-slate-900">{a.patientName}</p><p className="text-xs text-slate-400">{a.patientPhone}</p></td>
                        <td className="table-td capitalize">{a.source}</td>
                        <td className="table-td"><AppointmentStatusBadge status={a.status} /></td>
                        <td className="table-td text-slate-500">{a.status === 'waiting' ? duration(a.estimatedWaitMinutes) : '—'}</td>
                        <td className="table-td text-right">
                          {a.status === 'waiting' && (
                            <button className="rounded-lg px-2 py-1 text-xs font-semibold text-coral-600 hover:bg-coral-50" disabled={!!busyAction}
                              onClick={() => queueAction('skip', { appointmentId: a._id }, 'skip')}>Skip</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

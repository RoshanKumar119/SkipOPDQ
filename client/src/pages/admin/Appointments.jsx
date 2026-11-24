import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, UserPlus } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import { useHospitalRoom } from '../../context/SocketContext';
import LiveIndicator from '../../components/LiveIndicator';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { AppointmentStatusBadge } from '../../components/StatusBadge';
import { clock, prettyDate, todayStr } from '../../utils/format';
import AppointmentActions from '../../components/AppointmentActions';

const STATUSES = ['waiting', 'in-consultation', 'completed', 'skipped', 'cancelled'];

/** Today's appointments monitor with filters + "Add Walk-in Patient". */
export default function Appointments() {
  const [doctors, setDoctors] = useState([]);
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({ doctor: '', status: '', date: todayStr() });
  const [loading, setLoading] = useState(true);
  const [walkIn, setWalkIn] = useState(null); // modal form state
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/doctors').then((res) => setDoctors([...res.data].sort((a, b) => a.name.localeCompare(b.name)))).catch(() => {});
  }, []);

  const load = useCallback(() => {
    return api.get('/appointments', { params: filters })
      .then((res) => setList(res.data))
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Live: refresh the table whenever any doctor's queue changes
  useHospitalRoom({ 'queue:updated': () => load() });

  const submitWalkIn = async (e) => {
    e.preventDefault();
    if (!walkIn.doctorId || !walkIn.name.trim()) return toast.error('Select a doctor and enter the patient name');
    if (!/^[6-9]\d{9}$/.test(walkIn.phone)) return toast.error('Enter a valid 10-digit mobile number');
    setSaving(true);
    try {
      const res = await api.post('/appointments/walk-in', walkIn);
      toast.success(res.data.message, { duration: 5000 });
      setWalkIn(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const bookable = doctors.filter((d) => d.status !== 'unavailable' && d.scheduledToday);

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle={`${prettyDate(filters.date)} · Online and walk-in patients share the same token queue.`}
        actions={<><LiveIndicator /><button className="btn-primary" onClick={() => setWalkIn({ doctorId: '', name: '', phone: '' })}><UserPlus size={16} /> Add Walk-in Patient</button></>}
      />

      <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[180px_1fr_1fr_auto]">
        <input type="date" className="input" value={filters.date} min={todayStr()} aria-label="Filter by date"
          onChange={(e) => setFilters({ ...filters, date: e.target.value || todayStr() })} />
        <select className="input" value={filters.doctor} onChange={(e) => setFilters({ ...filters, doctor: e.target.value })} aria-label="Filter by doctor">
          <option value="">All doctors</option>
          {doctors.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <p className="self-center text-sm text-slate-500"><b className="text-slate-800">{list.length}</b> appointments</p>
      </div>

      {loading ? <Loader /> : list.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No appointments match" message="Try changing the filters, or add a walk-in patient." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Token</th>
                <th className="table-th">Patient</th>
                <th className="table-th">Doctor</th>
                <th className="table-th">Source</th>
                <th className="table-th">Booked at</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className="table-td"><span className="rounded-lg bg-primary-50 px-2.5 py-1 font-bold text-primary-700">#{a.tokenNumber}</span></td>
                  <td className="table-td"><p className="font-medium text-slate-900">{a.patientName}</p><p className="text-xs text-slate-400">{a.patientPhone}</p></td>
                  <td className="table-td"><p>{a.doctor?.name}</p><p className="text-xs text-slate-400">Room {a.doctor?.roomNumber}</p></td>
                  <td className="table-td">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${a.source === 'walk-in' ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>{a.source}</span>
                  </td>
                  <td className="table-td text-xs text-slate-500">{clock(a.createdAt)}</td>
                  <td className="table-td">
                    <AppointmentStatusBadge status={a.status} />
                    {a.rescheduledTo && <p className="mt-1 text-xs text-violet-700">→ {prettyDate(a.rescheduledTo.date)}, #{a.rescheduledTo.tokenNumber}</p>}
                    {a.status === 'cancelled' && !a.rescheduledTo && a.cancelledBy && (
                      <p className="mt-1 max-w-[180px] text-xs text-slate-400">by {a.cancelledBy}{a.cancelReason ? ` – ${a.cancelReason}` : ''}</p>
                    )}
                  </td>
                  <td className="table-td">
                    {a.status === 'waiting'
                      ? <AppointmentActions appointment={a} onChanged={() => load()} size="sm" />
                      : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!walkIn} title="Add Walk-in Patient" onClose={() => setWalkIn(null)}>
        {walkIn && (
          <form onSubmit={submitWalkIn} className="space-y-4">
            <div>
              <label className="label" htmlFor="w-doc">Doctor *</label>
              <select id="w-doc" className="input" value={walkIn.doctorId} onChange={(e) => setWalkIn({ ...walkIn, doctorId: e.target.value })}>
                <option value="">Select doctor</option>
                {bookable.map((d) => (
                  <option key={d._id} value={d._id}>{d.name} – {d.department?.name} ({d.queue?.waiting ?? 0} waiting)</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Only doctors with OPD today who are not marked unavailable are listed.</p>
            </div>
            <div>
              <label className="label" htmlFor="w-name">Patient name *</label>
              <input id="w-name" className="input" value={walkIn.name} onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })} placeholder="e.g. Ramesh Kale" />
            </div>
            <div>
              <label className="label" htmlFor="w-phone">Mobile number *</label>
              <input id="w-phone" className="input" inputMode="numeric" maxLength={10} value={walkIn.phone}
                onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value.replace(/\D/g, '') })} placeholder="9850012345" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setWalkIn(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Issuing token...' : 'Issue Token'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

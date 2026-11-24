import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { DAY_NAMES, DAY_SHORT, time12 } from '../../utils/format';

const EMPTY = { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', maxPatients: 30 };

/** Weekly OPD schedule editor (per doctor). */
export default function Schedules() {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/doctors')
      .then((res) => {
        const list = [...res.data].sort((a, b) => a.name.localeCompare(b.name));
        setDoctors(list);
        // Default to the first doctor, but never override a doctor the admin already picked
        if (list[0]) setDoctorId((current) => current || list[0]._id);
        else setLoading(false);
      })
      .catch((err) => {
        toast.error(errorMessage(err));
        setLoading(false);
      });
  }, []);

  const loadSessions = useCallback(() => {
    if (!doctorId) return;
    setLoading(true);
    api.get('/schedules', { params: { doctor: doctorId } })
      .then((res) => setSessions(res.data))
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [doctorId]);

  useEffect(loadSessions, [loadSessions]);

  const byDay = useMemo(() => DAY_NAMES.map((_, day) => sessions.filter((s) => s.dayOfWeek === day)), [sessions]);
  const doctor = doctors.find((d) => d._id === doctorId);

  const save = async (e) => {
    e.preventDefault();
    const { mode, data } = modal;
    if (data.startTime >= data.endTime) return toast.error('End time must be after start time');
    setSaving(true);
    try {
      const payload = { ...data, doctor: doctorId, dayOfWeek: Number(data.dayOfWeek), maxPatients: Number(data.maxPatients) };
      if (mode === 'add') await api.post('/schedules', payload);
      else await api.put(`/schedules/${data._id}`, payload);
      toast.success(mode === 'add' ? 'OPD session added' : 'OPD session updated');
      setModal(null);
      loadSessions();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Remove ${DAY_NAMES[s.dayOfWeek]} ${time12(s.startTime)} – ${time12(s.endTime)} session?`)) return;
    try {
      await api.delete(`/schedules/${s._id}`);
      toast.success('Session removed');
      loadSessions();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const setField = (k, v) => setModal((m) => ({ ...m, data: { ...m.data, [k]: v } }));

  return (
    <div>
      <PageHeader
        title="OPD Schedules"
        subtitle="Weekly OPD sessions per doctor. Patients can book tokens only on scheduled days."
        actions={doctorId && <button className="btn-primary" onClick={() => setModal({ mode: 'add', data: EMPTY })}><Plus size={16} /> Add Session</button>}
      />

      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-slate-700" htmlFor="sched-doc">Doctor</label>
        <select id="sched-doc" className="input sm:max-w-md" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          {doctors.map((d) => <option key={d._id} value={d._id}>{d.name} – {d.department?.name}</option>)}
        </select>
        {doctor && <span className="text-sm text-slate-500">Room {doctor.roomNumber} · {doctor.avgConsultationMinutes} min/patient</span>}
      </div>

      {loading ? <Loader /> : !doctorId ? (
        <EmptyState icon={CalendarDays} title="No doctors yet" message="Add a doctor first, then create their weekly OPD schedule." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {byDay.map((list, day) => (
            <div key={day} className={`card p-3 ${day === new Date().getDay() ? 'ring-2 ring-primary-300' : ''}`}>
              <p className="mb-2 flex items-center justify-between text-sm font-bold text-slate-800">
                {DAY_SHORT[day]}
                {day === new Date().getDay() && <span className="rounded-full bg-primary-50 px-2 text-[10px] font-semibold text-primary-600">Today</span>}
              </p>
              {list.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-2 py-3 text-center text-xs text-slate-400">No OPD</p>
              ) : (
                <div className="space-y-2">
                  {list.map((s) => (
                    <div key={s._id} className="rounded-lg border border-primary-100 bg-primary-50/60 px-2 py-2 text-xs">
                      <p className="font-semibold text-primary-700">{time12(s.startTime)} – {time12(s.endTime)}</p>
                      <p className="text-slate-500">Max {s.maxPatients} patients</p>
                      <div className="mt-1 flex gap-1">
                        <button className="rounded p-1 text-slate-500 hover:bg-white" title="Edit" onClick={() => setModal({ mode: 'edit', data: { ...s } })}><Pencil size={13} /></button>
                        <button className="rounded p-1 text-coral-500 hover:bg-white" title="Remove" onClick={() => remove(s)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} title={modal?.mode === 'add' ? 'Add OPD Session' : 'Edit OPD Session'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label" htmlFor="s-day">Day</label>
              <select id="s-day" className="input" value={modal.data.dayOfWeek} onChange={(e) => setField('dayOfWeek', e.target.value)}>
                {DAY_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="s-start">Start time</label>
                <input id="s-start" type="time" className="input" value={modal.data.startTime} onChange={(e) => setField('startTime', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="s-end">End time</label>
                <input id="s-end" type="time" className="input" value={modal.data.endTime} onChange={(e) => setField('endTime', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="s-max">Max patients</label>
              <input id="s-max" type="number" min={1} max={200} className="input" value={modal.data.maxPatients} onChange={(e) => setField('maxPatients', e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Session'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

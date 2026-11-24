import { useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, CalendarX } from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import Modal from './Modal';
import Loader from './Loader';
import { prettyDate, sessionsText } from '../utils/format';

const CANCEL_REASONS = ['Feeling better', 'Cannot reach the hospital today', 'Booked by mistake', 'Will visit another day'];

/**
 * Cancel / Reschedule buttons + dialogs for one appointment.
 * Used by patients (own bookings) and admin/reception (any booking).
 *
 * props:
 *  appointment – { _id, tokenNumber, date, status, patientName?, doctor?: { name } }
 *  onChanged(type, data) – called after a successful 'cancel' or 'reschedule'
 *  size – 'md' (default) or 'sm' for table rows
 */
export default function AppointmentActions({ appointment, onChanged, size = 'md', className = '' }) {
  const [dialog, setDialog] = useState(null); // 'cancel' | 'reschedule' | null
  const [reason, setReason] = useState('');
  const [options, setOptions] = useState(null);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);

  if (appointment.status !== 'waiting') return null;

  const small = size === 'sm';
  const btn = small ? 'rounded-lg px-2 py-1 text-xs font-semibold' : 'btn';

  const openReschedule = async () => {
    setDialog('reschedule');
    setOptions(null);
    setSelected('');
    try {
      const res = await api.get(`/appointments/${appointment._id}/reschedule-options`);
      setOptions(res.data.options);
      setSelected(res.data.options.find((o) => o.available)?.date || '');
    } catch (err) {
      toast.error(errorMessage(err));
      setDialog(null);
    }
  };

  const doCancel = async () => {
    setBusy(true);
    try {
      const res = await api.patch(`/appointments/${appointment._id}/cancel`, { reason });
      toast.success(res.data.message);
      setDialog(null);
      onChanged?.('cancel', res.data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const doReschedule = async () => {
    if (!selected) return toast.error('Please choose a new date');
    setBusy(true);
    try {
      const res = await api.patch(`/appointments/${appointment._id}/reschedule`, { date: selected });
      toast.success(res.data.message, { duration: 6000 });
      setDialog(null);
      onChanged?.('reschedule', res.data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const who = appointment.patientName ? `${appointment.patientName}'s ` : 'your ';

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <button type="button" onClick={openReschedule}
          className={`${btn} border border-primary-300 text-primary-700 hover:bg-primary-50`}>
          <CalendarClock size={small ? 13 : 16} className={small ? 'mr-1 inline' : ''} /> Reschedule
        </button>
        <button type="button" onClick={() => { setReason(''); setDialog('cancel'); }}
          className={`${btn} border border-coral-400 text-coral-600 hover:bg-coral-50`}>
          <CalendarX size={small ? 13 : 16} className={small ? 'mr-1 inline' : ''} /> Cancel
        </button>
      </div>

      {/* Cancel dialog */}
      <Modal open={dialog === 'cancel'} title="Cancel appointment?" onClose={() => !busy && setDialog(null)}>
        <p className="text-sm text-slate-600">
          This will cancel {who}<b>token #{appointment.tokenNumber}</b>
          {appointment.doctor?.name ? <> with <b>{appointment.doctor.name}</b></> : null} on {prettyDate(appointment.date)}.
          The slot is released and everyone behind moves up in the queue.
        </p>
        <label className="label mt-4" htmlFor="cancel-reason">Reason (optional)</label>
        <input id="cancel-reason" className="input" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you cancelling?" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CANCEL_REASONS.map((r) => (
            <button type="button" key={r} onClick={() => setReason(r)} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200">{r}</button>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setDialog(null)} disabled={busy}>Keep appointment</button>
          <button className="btn-coral" onClick={doCancel} disabled={busy}>{busy ? 'Cancelling...' : 'Yes, cancel token'}</button>
        </div>
      </Modal>

      {/* Reschedule dialog */}
      <Modal open={dialog === 'reschedule'} title="Reschedule appointment" onClose={() => !busy && setDialog(null)}>
        <p className="text-sm text-slate-600">
          Move {who}<b>token #{appointment.tokenNumber}</b> ({prettyDate(appointment.date)}) to another OPD day.
          A new token number will be issued for the chosen day.
        </p>
        {!options ? <Loader label="Checking OPD availability..." className="py-8" /> : (
          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
            {options.map((o) => (
              <label key={o.date}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                  !o.available ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                    : selected === o.date ? 'cursor-pointer border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'cursor-pointer border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="newDate" value={o.date} disabled={!o.available} checked={selected === o.date}
                  onChange={() => setSelected(o.date)} className="accent-primary-500" />
                <span className="flex-1">
                  <span className="block font-semibold text-slate-800">
                    {o.isToday ? 'Today' : o.dayName}, {prettyDate(o.date).split(', ').slice(1).join(', ')}
                  </span>
                  <span className="block text-xs text-slate-500">{o.sessions.length ? sessionsText(o.sessions) : 'No OPD'}</span>
                </span>
                <span className="text-right text-xs">
                  {o.available
                    ? <span className="font-medium text-emerald-600">{o.capacity - o.booked} slots left</span>
                    : <span className="text-slate-500">{o.reason}</span>}
                </span>
              </label>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setDialog(null)} disabled={busy}>Close</button>
          <button className="btn-primary" onClick={doReschedule} disabled={busy || !selected}>{busy ? 'Rescheduling...' : 'Confirm new date'}</button>
        </div>
      </Modal>
    </>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BellRing, CalendarClock, CalendarX, MessageCircle, Clock, DoorOpen, MapPin, PartyPopper, TriangleAlert, UserRound, Users } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import { useQueueRoom } from '../../context/SocketContext';
import LiveIndicator from '../../components/LiveIndicator';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { clock, duration, prettyDate, sessionsText } from '../../utils/format';
import { Phase2Button } from '../../components/ComingSoonBadge';
import AppointmentActions from '../../components/AppointmentActions';

const APPROACHING_AHEAD = 2; // notify when only this many patients are ahead

/**
 * Live Queue – the patient's real-time token tracker.
 * Updates instantly through Socket.IO whenever the doctor changes status or moves the queue.
 */
export default function LiveQueue() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(false); // brief highlight when an update arrives
  const notified = useRef({ approaching: false, turn: false });
  const selfChange = useRef(false); // true while this patient is cancelling/rescheduling

  const load = useCallback(() => {
    return api.get(`/appointments/${appointmentId}`)
      .then((res) => {
        setAppointment(res.data.appointment);
        setQueue(res.data.queue);
        setError('');
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  useEffect(() => {
    load();
    // Safety net: refresh every 60s in case the socket was disconnected for a while
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const pulse = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
  };

  // ---- Real-time updates
  useQueueRoom(appointment?.doctor, appointment?.date, {
    'queue:updated': (snapshot) => {
      if (snapshot.doctorId !== String(appointment?.doctor) || snapshot.date !== appointment?.date) return;
      setQueue(snapshot);
      pulse();
      // Cancelled/rescheduled from another screen (e.g. by reception) -> reload details and tell the patient
      const mine = snapshot.tokens.find((t) => t.appointmentId === appointmentId);
      if (mine?.status === 'cancelled' && appointment?.status !== 'cancelled') {
        load();
        if (!selfChange.current) toast.error('Your appointment was cancelled by the hospital. Please contact reception.', { duration: 8000 });
      }
    },
    'doctor:statusChanged': (doctor) => {
      if (doctor._id !== String(appointment?.doctor)) return;
      setQueue((q) => (q ? { ...q, doctor: { ...q.doctor, ...doctor } } : q));
      const label = { available: 'Available', busy: 'Busy', unavailable: 'Unavailable' }[doctor.status];
      toast(`${doctor.name} is now ${label}${doctor.delayMinutes ? ` · ${doctor.delayMinutes} min delay` : ''}`, { icon: '🩺', id: 'doctor-status' }); // one toast, replaced on each change
    },
  });

  const myToken = useMemo(() => queue?.tokens?.find((t) => t.appointmentId === appointmentId), [queue, appointmentId]);
  const status = myToken?.status || appointment?.status;
  const ahead = myToken?.patientsAhead;
  const upcoming = !!appointment?.isUpcoming;

  // ---- In-app notifications
  useEffect(() => {
    if (!myToken || upcoming) return;
    if (status === 'waiting' && ahead !== null && ahead > 0 && ahead <= APPROACHING_AHEAD && !notified.current.approaching) {
      notified.current.approaching = true;
      toast(`Your turn is approaching, please reach the OPD. Only ${ahead} patient${ahead > 1 ? 's' : ''} ahead of you.`, {
        icon: '🔔', duration: 8000, style: { background: '#F26B5B', color: '#fff', fontWeight: 600 },
      });
    }
    if (status === 'in-consultation' && !notified.current.turn) {
      notified.current.turn = true;
      toast.success(`It's your turn! Please go to Room ${queue?.doctor?.roomNumber}.`, { duration: 10000, style: { fontWeight: 600 } });
    }
  }, [myToken, status, ahead, upcoming, queue?.doctor?.roomNumber]);

  const onChanged = (type, data) => {
    if (type === 'reschedule') navigate(`/queue/${data.appointment._id}`);
    else load();
  };

  if (loading) return <Loader label="Connecting to the live queue..." />;
  if (error || !appointment || !queue) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><EmptyState title="Could not open the live queue" message={error} action={<Link to="/appointments" className="btn-primary">My Appointments</Link>} /></div>;
  }

  const doctor = queue.doctor;
  const isToday = queue.date === appointment.date;
  const unavailable = doctor.status === 'unavailable';

  // Queue progress: share of tokens before mine that are already finished
  const before = queue.tokens.filter((t) => t.tokenNumber < appointment.tokenNumber && t.status !== 'cancelled');
  const finished = before.filter((t) => ['completed', 'skipped'].includes(t.status)).length;
  const progress = status === 'waiting'
    ? Math.round(((finished + (queue.nowServing && queue.nowServing < appointment.tokenNumber ? 0.5 : 0)) / Math.max(before.length, 1)) * 100)
    : 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/appointments" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-primary-600"><ArrowLeft size={16} /> My Appointments</Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Updated {clock(queue.updatedAt)}</span>
          <LiveIndicator />
        </div>
      </div>

      {/* Doctor strip */}
      <div className="card mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live OPD Queue · {prettyDate(appointment.date)}</p>
          <h1 className="text-xl font-bold text-slate-900">{doctor.name}</h1>
          <p className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{doctor.specialization}</span>
            <span className="flex items-center gap-1"><DoorOpen size={14} /> Room {doctor.roomNumber}</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {doctor.department?.location}</span>
          </p>
        </div>
        <StatusBadge status={doctor.status} size="lg" />
      </div>

      {/* Doctor status alerts */}
      {!upcoming && unavailable && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-red-700">
          <TriangleAlert className="mt-0.5 shrink-0" />
          <div><p className="font-bold">Doctor currently unavailable</p>{doctor.statusNote && <p className="text-sm">{doctor.statusNote}</p>}<p className="text-sm">Your token is safe. Waiting time will be shown once the doctor is back.</p></div>
        </div>
      )}
      {!upcoming && doctor.status === 'busy' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
          <TriangleAlert className="mt-0.5 shrink-0" />
          <div><p className="font-bold">Doctor is busy{doctor.statusNote ? `: ${doctor.statusNote}` : ''}</p>{doctor.delayMinutes > 0 && <p className="text-sm">Running about {doctor.delayMinutes} minutes late – this is included in your waiting time.</p>}</div>
        </div>
      )}
      {!upcoming && doctor.status === 'available' && doctor.delayMinutes > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
          <Clock className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">The doctor is running about {doctor.delayMinutes} minutes late{doctor.statusNote ? ` – ${doctor.statusNote}` : ''}. This is included in your waiting time.</p>
        </div>
      )}

      {/* Big token display */}
      <div className={`grid gap-4 transition sm:grid-cols-2 ${flash ? 'scale-[1.01]' : ''}`}>
        <div className={`relative overflow-hidden rounded-3xl p-8 text-center text-white shadow-lg ${status === 'in-consultation' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-primary-500 to-primary-700'}`}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <p className="text-sm font-semibold uppercase tracking-widest text-white/80">Your Token</p>
          <p className="mt-2 text-8xl font-extrabold leading-none tracking-tight sm:text-9xl">{appointment.tokenNumber}</p>
          <p className="mt-3 text-sm text-white/80">{appointment.patientName} · {appointment.source === 'walk-in' ? 'Walk-in' : 'Online booking'}</p>
        </div>
        <div className={`rounded-3xl border-2 bg-white p-8 text-center shadow-sm transition ${flash ? 'border-coral-400' : 'border-slate-200'}`}>
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Now Serving</p>
          <p key={queue.nowServing} className="mt-2 animate-[pulse_0.8s_ease-in-out_1] text-8xl font-extrabold leading-none tracking-tight text-slate-800 sm:text-9xl">
            {queue.nowServing ?? '—'}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            {queue.nowServing ? `Token #${queue.nowServing} is with the doctor` : queue.counts.waiting ? 'Doctor will call the next token shortly' : 'No one in consultation'}
          </p>
        </div>
      </div>

      {/* Status-specific main message */}
      <div className="mt-6">
        {status === 'waiting' && upcoming && (
          <div className="card flex items-center gap-4 border-sky-200 bg-sky-50 p-6 text-sky-900">
            <CalendarClock size={32} className="shrink-0" />
            <div>
              <p className="text-xl font-bold">Upcoming appointment – {prettyDate(appointment.date)}</p>
              <p className="text-sm">OPD timing: {sessionsText(doctor.todaySessions)}.
                Live tracking, waiting time and arrival suggestions start on the day of your visit.</p>
            </div>
          </div>
        )}
        {status === 'waiting' && !upcoming && (
          <div className="card p-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-600"><Users size={26} /></div>
                <div><p className="text-sm text-slate-500">Patients ahead of you</p><p className="text-3xl font-extrabold text-slate-900">{ahead ?? '—'}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><Clock size={26} /></div>
                <div>
                  <p className="text-sm text-slate-500">Estimated waiting time</p>
                  {unavailable ? (
                    <p className="text-lg font-bold text-red-600">Doctor currently unavailable</p>
                  ) : (
                    <p className="text-3xl font-extrabold text-slate-900">{duration(myToken?.estimatedWaitMinutes)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-coral-50 p-3 text-coral-500"><MapPin size={26} /></div>
                <div>
                  <p className="text-sm text-slate-500">{unavailable ? 'Suggested arrival' : 'Reach the OPD by'}</p>
                  <p className={`font-extrabold text-coral-600 ${unavailable ? 'text-lg' : 'text-3xl'}`}>{unavailable ? 'Wait for update' : myToken?.reachBy ? clock(myToken.reachBy) : '—'}</p>
                </div>
              </div>
            </div>

            {!unavailable && myToken && (
              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-500">
                Estimate = {ahead} patient{ahead === 1 ? '' : 's'} ahead × {doctor.avgConsultationMinutes} min avg. consultation
                {doctor.delayMinutes > 0 && ` + ${doctor.delayMinutes} min doctor delay`}
                {new Date(queue.queueStartsAt) > new Date(queue.updatedAt) && ` · OPD starts at ${clock(queue.queueStartsAt)}`}
              </p>
            )}

            {/* Queue progress */}
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
                <span>Queue progress</span><span>{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}

        {status === 'in-consultation' && (
          <div className="card flex items-center gap-4 border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
            <BellRing size={32} className="shrink-0 animate-bounce" />
            <div><p className="text-xl font-bold">It&apos;s your turn!</p><p>Please go to <b>Room {doctor.roomNumber}</b> ({doctor.department?.location}).</p></div>
          </div>
        )}
        {status === 'completed' && (
          <div className="card flex items-center gap-4 p-6">
            <PartyPopper size={32} className="shrink-0 text-primary-500" />
            <div><p className="text-xl font-bold text-slate-900">Consultation completed</p><p className="text-slate-500">Thank you for using SkipOPDQ. Get well soon!</p></div>
          </div>
        )}
        {status === 'skipped' && (
          <div className="card flex items-center gap-4 border-orange-200 bg-orange-50 p-6 text-orange-800">
            <TriangleAlert size={32} className="shrink-0" />
            <div><p className="text-xl font-bold">You missed your turn</p><p>Your token was marked as a no-show. Please contact the reception desk.</p></div>
          </div>
        )}
        {status === 'cancelled' && (
          <div className="card flex items-center gap-4 p-6 text-slate-700">
            <CalendarX size={32} className="shrink-0 text-slate-400" />
            <div className="flex-1">
              {appointment.rescheduledTo ? (
                <>
                  <p className="text-xl font-bold text-slate-900">Appointment rescheduled</p>
                  <p className="text-sm">Moved to {prettyDate(appointment.rescheduledTo.date)} with new token #{appointment.rescheduledTo.tokenNumber}.</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-slate-900">Appointment cancelled</p>
                  <p className="text-sm">
                    {appointment.cancelledBy === 'admin' ? 'Cancelled by the hospital' : 'You cancelled this token'}
                    {appointment.cancelReason ? ` – ${appointment.cancelReason}` : ''}.
                  </p>
                </>
              )}
            </div>
            {appointment.rescheduledTo
              ? <Link to={`/queue/${appointment.rescheduledTo._id}`} className="btn-primary">View new token</Link>
              : <Link to={`/doctors/${appointment.doctor}`} className="btn-outline">Book again</Link>}
          </div>
        )}
      </div>

      {/* Manage booking + Phase 2 alerts */}
      {['waiting', 'in-consultation'].includes(status) && (
        <div className="card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div onClickCapture={() => { selfChange.current = true; setTimeout(() => { selfChange.current = false; }, 30000); }}>
            {status === 'waiting'
              ? <AppointmentActions appointment={{ ...appointment, status, doctor: { name: doctor.name } }} onChanged={onChanged} />
              : <p className="text-sm text-slate-500">You are with the doctor – this token can no longer be changed.</p>}
          </div>
          <Phase2Button icon={MessageCircle} className="sm:w-auto">Get SMS / WhatsApp alerts</Phase2Button>
        </div>
      )}

      {/* Token strip – visual queue */}
      {isToday && queue.tokens.length > 0 && (
        <div className="card mt-6 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><UserRound size={18} className="text-primary-500" /> {upcoming ? `Queue for ${prettyDate(appointment.date)}` : "Today's queue"}</h2>
          <div className="flex flex-wrap gap-2">
            {queue.tokens.filter((t) => t.status !== 'cancelled').map((t) => {
              const mine = t.appointmentId === appointmentId;
              const cls = {
                completed: 'bg-slate-100 text-slate-400 line-through',
                skipped: 'bg-orange-50 text-orange-400 line-through',
                'in-consultation': 'bg-emerald-500 text-white ring-4 ring-emerald-200',
                waiting: 'bg-white text-slate-700 border border-slate-300',
              }[t.status];
              return (
                <div key={t.appointmentId} className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold transition-all ${cls} ${mine ? 'outline outline-2 outline-offset-2 outline-coral-500' : ''}`}
                  title={`Token ${t.tokenNumber} – ${t.status}${mine ? ' (you)' : ''}`}>
                  {t.tokenNumber}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500" /> With doctor</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-slate-300 bg-white" /> Waiting</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-200" /> Done</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded outline outline-2 outline-coral-500" /> You</span>
          </div>
        </div>
      )}
    </div>
  );
}

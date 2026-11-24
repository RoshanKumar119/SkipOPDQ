import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Award, Building2, CalendarDays, Clock, DoorOpen, GraduationCap, Hourglass, Ticket, TriangleAlert } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useHospitalRoom } from '../../context/SocketContext';
import LiveIndicator from '../../components/LiveIndicator';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { DAY_NAMES, duration, sessionsText, time12 } from '../../utils/format';
import ComingSoonBadge, { Phase2Tooltip } from '../../components/ComingSoonBadge';

/** Doctor profile: weekly schedule, live status and "Book Token for Today". */
export default function DoctorDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);

  const load = useCallback(() => {
    return api.get(`/doctors/${id}`)
      .then((res) => {
        setDoctor(res.data);
        setError('');
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Live status / queue updates for this doctor
  useHospitalRoom({
    'doctor:statusChanged': (view) => view._id === id && setDoctor((d) => ({ ...d, ...view, weeklySchedule: d?.weeklySchedule })),
    'queue:updated': (snap) =>
      snap.doctorId === id &&
      setDoctor((d) => d && { ...d, queue: { nowServing: snap.nowServing, waiting: snap.counts.waiting, total: snap.counts.total, completed: snap.counts.completed } }),
  });

  const book = async () => {
    setBooking(true);
    try {
      const res = await api.post('/appointments', { doctorId: id });
      toast.success(res.data.message);
      navigate(`/queue/${res.data.appointment._id}`);
    } catch (err) {
      toast.error(errorMessage(err));
      load();
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <Loader label="Loading doctor details..." />;
  if (error || !doctor) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><EmptyState title="Doctor not found" message={error} action={<Link to="/doctors" className="btn-primary">Back to doctors</Link>} /></div>;
  }

  const q = doctor.queue || {};
  const ahead = (q.waiting || 0) + (q.nowServing ? 1 : 0);
  const estimate = ahead * doctor.avgConsultationMinutes + (doctor.delayMinutes || 0);
  const today = new Date().getDay();

  // Booking rules mirrored from the backend (backend is the source of truth)
  let blockReason = '';
  if (doctor.status === 'unavailable') blockReason = `${doctor.name} is currently unavailable${doctor.statusNote ? ` – ${doctor.statusNote}` : ''}. Online booking is closed for today.`;
  else if (!doctor.scheduledToday) blockReason = `${doctor.name} has no OPD scheduled today. Please check the weekly schedule.`;

  const sessionsByDay = DAY_NAMES.map((_, day) => (doctor.weeklySchedule || []).filter((s) => s.dayOfWeek === day));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/doctors" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-primary-600"><ArrowLeft size={16} /> All doctors</Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Profile */}
          <div className="card p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar name={doctor.name} initials={doctor.initials} size="lg" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{doctor.name}</h1>
                  <StatusBadge status={doctor.status} size="lg" />
                </div>
                <p className="mt-1 text-slate-600">{doctor.specialization}</p>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <span className="flex items-center gap-2"><GraduationCap size={16} className="text-primary-500" /> {doctor.qualification}</span>
                  <span className="flex items-center gap-2"><Award size={16} className="text-primary-500" /> {doctor.experienceYears} years experience</span>
                  <span className="flex items-center gap-2"><Building2 size={16} className="text-primary-500" /> {doctor.department?.name} · {doctor.department?.location}</span>
                  <span className="flex items-center gap-2"><DoorOpen size={16} className="text-primary-500" /> Room {doctor.roomNumber}</span>
                  <span className="flex items-center gap-2"><Clock size={16} className="text-primary-500" /> Today: {sessionsText(doctor.todaySessions)}</span>
                  <span className="flex items-center gap-2"><Hourglass size={16} className="text-primary-500" /> ~{doctor.avgConsultationMinutes} min per patient</span>
                </div>
              </div>
            </div>

            {(doctor.statusNote || doctor.delayMinutes > 0) && (
              <div className={`mt-5 flex items-start gap-3 rounded-xl p-4 text-sm ${doctor.status === 'unavailable' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                <TriangleAlert size={18} className="mt-0.5 shrink-0" />
                <div>
                  {doctor.statusNote && <p className="font-semibold">{doctor.statusNote}</p>}
                  {doctor.delayMinutes > 0 && <p>The doctor is running about {doctor.delayMinutes} minutes late.</p>}
                </div>
              </div>
            )}
          </div>

          {/* Weekly schedule */}
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><CalendarDays size={18} className="text-primary-500" /> Weekly OPD Schedule</h2>
            <div className="divide-y divide-slate-100">
              {sessionsByDay.map((list, day) => (
                <div key={day} className={`flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center ${day === today ? 'font-semibold' : ''}`}>
                  <span className="w-36 text-sm text-slate-700">
                    {DAY_NAMES[day]} {day === today && <span className="ml-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] text-primary-600">TODAY</span>}
                  </span>
                  <span className="flex flex-wrap gap-2">
                    {list.length === 0 ? <span className="text-sm text-slate-400">No OPD</span> : list.map((s) => (
                      <span key={s._id} className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">{time12(s.startTime)} – {time12(s.endTime)}</span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking panel */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-6">
            <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">Today&apos;s OPD queue</h2><LiveIndicator /></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-primary-50 p-3 text-center">
                <p className="text-[11px] font-semibold uppercase text-primary-600">Now serving</p>
                <p className="text-3xl font-extrabold text-primary-700">{q.nowServing ? `#${q.nowServing}` : '—'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[11px] font-semibold uppercase text-slate-500">Waiting</p>
                <p className="text-3xl font-extrabold text-slate-800">{q.waiting ?? 0}</p>
              </div>
            </div>
            {!blockReason && doctor.status !== 'unavailable' && (
              <p className="mt-3 text-center text-sm text-slate-500">If you book now: ~<b className="text-slate-800">{duration(estimate)}</b> estimated wait</p>
            )}

            {/* Booking type – priority booking is planned for Phase 2 */}
            <div className="mt-5 space-y-2">
              <label className="flex items-center gap-3 rounded-xl border-2 border-primary-500 bg-primary-50/50 px-3 py-2.5 text-sm">
                <input type="radio" name="bookingType" checked readOnly className="accent-primary-500" />
                <span className="flex-1 font-semibold text-slate-800">Regular token</span>
                <span className="font-bold text-primary-600">Free</span>
              </label>
              <Phase2Tooltip className="w-full">
                <label className="phase2-disabled flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm">
                  <input type="radio" name="bookingType" disabled />
                  <span className="flex-1 text-left font-semibold text-slate-600">Priority Booking (₹)</span>
                  <ComingSoonBadge label="Phase 2" />
                </label>
              </Phase2Tooltip>
            </div>

            <div className="mt-5">
              {blockReason ? (
                <>
                  <button className="btn-primary w-full py-3" disabled><Ticket size={18} /> Book Token for Today</button>
                  <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{blockReason}</p>
                </>
              ) : !user ? (
                <Link to="/login" state={{ from: `/doctors/${id}` }} className="btn-primary w-full py-3"><Ticket size={18} /> Log in to Book Token</Link>
              ) : user.role !== 'patient' ? (
                <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Only patient accounts can book tokens. Reception can add walk-in patients from the Admin panel.</p>
              ) : (
                <button className="btn-primary w-full py-3 text-base" onClick={book} disabled={booking}>
                  <Ticket size={18} /> {booking ? 'Booking...' : 'Book Token for Today'}
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

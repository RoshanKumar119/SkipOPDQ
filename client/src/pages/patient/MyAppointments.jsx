import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, CalendarCheck, CalendarClock, DoorOpen } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import AppointmentActions from '../../components/AppointmentActions';
import { AppointmentStatusBadge } from '../../components/StatusBadge';
import { prettyDate, todayStr } from '../../utils/format';

/** One appointment row. Cancel / Reschedule are shown for waiting tokens. */
function AppointmentCard({ a, today, onChanged }) {
  const isToday = a.date === today;
  const isUpcoming = a.date > today;
  const active = (isToday || isUpcoming) && ['waiting', 'in-consultation'].includes(a.status);

  return (
    <div className={`card flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${active ? 'border-primary-200 ring-1 ring-primary-100' : ''}`}>
      <div className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl ${active ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
        <span className="text-[10px] font-semibold uppercase opacity-80">Token</span>
        <span className={`text-3xl font-extrabold leading-none ${a.status === 'cancelled' ? 'line-through opacity-60' : ''}`}>{a.tokenNumber}</span>
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-900">{a.doctor?.name}</h3>
          {a.rescheduledTo
            ? <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-600/20">Rescheduled</span>
            : <AppointmentStatusBadge status={a.status} />}
          {isUpcoming && active && <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">Upcoming</span>}
        </div>
        <p className="text-sm text-slate-600">{a.doctor?.specialization} · {a.doctor?.department}</p>
        <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><CalendarCheck size={13} /> {prettyDate(a.date)}</span>
          <span className="flex items-center gap-1"><DoorOpen size={13} /> Room {a.doctor?.roomNumber}</span>
          <span className="capitalize">{a.source}</span>
        </p>
        {a.rescheduledTo && (
          <p className="mt-1 text-xs font-medium text-violet-700">Moved to {prettyDate(a.rescheduledTo.date)} – new token #{a.rescheduledTo.tokenNumber}</p>
        )}
        {a.status === 'cancelled' && !a.rescheduledTo && (
          <p className="mt-1 text-xs text-slate-500">
            Cancelled{a.cancelledBy === 'admin' ? ' by the hospital' : ''}{a.cancelReason ? ` – ${a.cancelReason}` : ''}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        {isToday && active && <Link to={`/queue/${a._id}`} className="btn-primary"><Activity size={16} /> Track Live</Link>}
        {isUpcoming && active && <Link to={`/queue/${a._id}`} className="btn-outline"><CalendarClock size={16} /> View details</Link>}
        <AppointmentActions appointment={a} onChanged={onChanged} size="sm" />
      </div>
    </div>
  );
}

/** Patient's appointments: today, upcoming (after rescheduling) and past. */
export default function MyAppointments() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    return api.get('/appointments/my')
      .then((res) => setList(res.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onChanged = (type, data) => {
    // After rescheduling to today, jump straight to the live queue; otherwise refresh the list
    if (type === 'reschedule' && data.appointment.date === todayStr()) navigate(`/queue/${data.appointment._id}`);
    else load();
  };

  const today = todayStr();
  const sections = [
    { title: 'Today', items: list.filter((a) => a.date === today), empty: 'No tokens booked for today.' },
    { title: 'Upcoming', items: list.filter((a) => a.date > today).reverse() },
    { title: 'Past visits', items: list.filter((a) => a.date < today) },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader title="My Appointments" subtitle="Your OPD tokens. Track today's queue live, or cancel / reschedule a waiting token."
        actions={<Link to="/doctors" className="btn-outline">Book another token</Link>} />

      {loading ? <Loader /> : error ? <EmptyState title="Could not load appointments" message={error} /> : list.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No appointments yet" message="Find a doctor and book a token for today's OPD." action={<Link to="/doctors" className="btn-primary">Find Doctors</Link>} />
      ) : (
        <div className="space-y-8">
          {sections.map(({ title, items, empty }) => (items.length || empty) && (
            <section key={title}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
              {items.length
                ? <div className="space-y-3">{items.map((a) => <AppointmentCard key={a._id} a={a} today={today} onChanged={onChanged} />)}</div>
                : <p className="text-sm text-slate-500">{empty}</p>}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

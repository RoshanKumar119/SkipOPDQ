import { Link } from 'react-router-dom';
import { Clock, DoorOpen, Hourglass, Ticket } from 'lucide-react';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';
import { sessionsText } from '../utils/format';

/** Doctor card on the Find Doctors page with live status and queue summary. */
export default function DoctorCard({ doctor }) {
  const q = doctor.queue || {};
  return (
    <Link
      to={`/doctors/${doctor._id}`}
      className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <Avatar name={doctor.name} initials={doctor.initials} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-bold text-slate-900 group-hover:text-primary-600">{doctor.name}</h3>
            <StatusBadge status={doctor.status} />
          </div>
          <p className="text-sm text-slate-600">{doctor.specialization}</p>
          <p className="text-xs text-slate-400">{doctor.department?.name} · {doctor.qualification}</p>
        </div>
      </div>

      {doctor.status !== 'available' && doctor.statusNote && (
        <p className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-medium ${doctor.status === 'busy' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
          {doctor.statusNote}{doctor.delayMinutes > 0 && ` · Running ${doctor.delayMinutes} min late`}
        </p>
      )}
      {doctor.status === 'available' && doctor.delayMinutes > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">Running {doctor.delayMinutes} min late</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><DoorOpen size={14} className="text-slate-400" /> Room {doctor.roomNumber || '—'}</span>
        <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {sessionsText(doctor.todaySessions)}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
        <div className="rounded-xl bg-primary-50 px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-primary-600"><Ticket size={12} /> Now serving</p>
          <p className="text-lg font-bold text-primary-700">{q.nowServing ? `#${q.nowServing}` : '—'}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500"><Hourglass size={12} /> Waiting</p>
          <p className="text-lg font-bold text-slate-800">{q.waiting ?? 0} <span className="text-xs font-medium text-slate-400">patients</span></p>
        </div>
      </div>
    </Link>
  );
}

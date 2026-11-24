import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Building2, CalendarDays, ClipboardList, LayoutDashboard, MonitorPlay, Stethoscope } from 'lucide-react';

// Sidebar items. `phase2` items open preview/placeholder pages.
export const ADMIN_MENU = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/appointments', label: 'Appointments & Walk-ins', icon: ClipboardList },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/schedules', label: 'OPD Schedules', icon: CalendarDays },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, tag: 'Preview' },
  { to: '/admin/display-board', label: 'TV Token Display', icon: MonitorPlay, tag: 'Phase 2' },
];

/** Admin area: sidebar on desktop, scrollable tab bar on mobile. */
export default function AdminLayout() {
  const cls = ({ isActive }) =>
    `flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
      <aside className="lg:w-60 lg:shrink-0">
        <nav className="card flex gap-1 overflow-x-auto p-2 lg:sticky lg:top-20 lg:flex-col">
          {ADMIN_MENU.map(({ to, label, icon: Icon, end, tag }) => (
            <NavLink key={to} to={to} end={end} className={cls}>
              <Icon size={18} /> {label}
              {tag && <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">{tag}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  );
}

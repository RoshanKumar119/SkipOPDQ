import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Building, ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { Phase2Tooltip } from './ComingSoonBadge';

// Navigation links per role
const LINKS = {
  guest: [
    { to: '/', label: 'Home', end: true },
    { to: '/doctors', label: 'Find Doctors' },
    { to: '/progress', label: 'Project Progress' },
  ],
  patient: [
    { to: '/doctors', label: 'Find Doctors' },
    { to: '/appointments', label: 'My Appointments' },
    { to: '/profile', label: 'Profile' },
    { to: '/progress', label: 'Project Progress' },
  ],
  doctor: [
    { to: '/doctor', label: 'My Dashboard' },
    { to: '/progress', label: 'Project Progress' },
  ],
  admin: [
    { to: '/admin', label: 'Admin Panel' },
    { to: '/progress', label: 'Project Progress' },
  ],
};

const ROLE_LABEL = { patient: 'Patient', doctor: 'Doctor', admin: 'Hospital Admin' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = LINKS[user?.role || 'guest'];

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {user?.role === 'admin' && (
            <Phase2Tooltip text="Multi-hospital support – Planned for Phase 2">
              <button type="button" disabled className="phase2-disabled flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-left text-xs text-slate-500">
                <Building size={14} />
                <span><span className="block text-[10px] uppercase tracking-wide">Switch Hospital</span><span className="block font-semibold text-slate-700">City Care (Demo)</span></span>
                <ChevronDown size={14} />
              </button>
            </Phase2Tooltip>
          )}
          {user ? (
            <>
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
              </div>
              <button onClick={handleLogout} className="btn-ghost" title="Log out"><LogOut size={16} /> Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-ghost">Log in</NavLink>
              <NavLink to="/register" className="btn-primary">Register</NavLink>
            </>
          )}
        </div>

        <button className="btn-ghost ml-auto md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>{l.label}</NavLink>
            ))}
            {user ? (
              <button onClick={handleLogout} className="btn-ghost justify-start"><LogOut size={16} /> Logout ({user.name})</button>
            ) : (
              <div className="mt-2 flex gap-2">
                <NavLink to="/login" className="btn-outline flex-1" onClick={() => setOpen(false)}>Log in</NavLink>
                <NavLink to="/register" className="btn-primary flex-1" onClick={() => setOpen(false)}>Register</NavLink>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

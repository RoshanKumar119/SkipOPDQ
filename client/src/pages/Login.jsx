import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, Shield, Stethoscope, User } from 'lucide-react';
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/axios';
import Logo from '../components/Logo';

// Demo accounts created by the seed script
const DEMO_ACCOUNTS = [
  { role: 'patient', label: 'Login as Patient', email: 'patient@skipopdq.demo', icon: User },
  { role: 'doctor', label: 'Login as Doctor', email: 'doctor@skipopdq.demo', icon: Stethoscope },
  { role: 'admin', label: 'Login as Admin', email: 'admin@skipopdq.demo', icon: Shield },
];
const DEMO_PASSWORD = 'demo123';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const doLogin = async (email, password) => {
    setSubmitting(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome, ${user.role === 'doctor' ? user.name : user.name.split(' ')[0]}!`);
      // Return to the page the user tried to open if it belongs to their role
      const from = location.state?.from;
      const home = HOME_BY_ROLE[user.role];
      const canReturn = from && (user.role === 'patient' ? !from.startsWith('/admin') && !from.startsWith('/doctor') : from.startsWith(home));
      navigate(canReturn ? from : home, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please enter email and password');
    doLogin(form.email, form.password);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-bold text-slate-900">Log in to SkipOPDQ</h1>
          <p className="mt-1 text-sm text-slate-500">Patients, doctors and hospital staff use the same login.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" placeholder="you@example.com" autoComplete="email"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" placeholder="••••••" autoComplete="current-password"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
              <LogIn size={16} /> {submitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> Demo Login <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid gap-2">
            {DEMO_ACCOUNTS.map(({ role, label, email, icon: Icon }) => (
              <button key={role} type="button" className="btn-outline w-full justify-start" disabled={submitting}
                onClick={() => doLogin(email, DEMO_PASSWORD)}>
                <Icon size={16} /> {label}
                <span className="ml-auto text-xs font-normal text-slate-400">{email}</span>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            New patient?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

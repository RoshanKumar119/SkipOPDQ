import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/axios';
import Logo from '../components/Logo';

/** Patient self-registration. Doctor and admin accounts are created by the hospital admin. */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number';
    if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { confirm, ...payload } = form; // eslint-disable-line no-unused-vars
      await register(payload);
      toast.success('Account created! Find a doctor and book your token.');
      navigate('/doctors', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} type={type} className={`input ${errors[name] ? 'border-coral-500' : ''}`} placeholder={placeholder}
        value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
      {errors[name] && <p className="mt-1 text-xs text-coral-600">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-bold text-slate-900">Create a patient account</h1>
          <p className="mt-1 text-sm text-slate-500">Book OPD tokens and track your turn live.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {field('name', 'Full name', 'text', 'e.g. Priya Kulkarni')}
            {field('email', 'Email', 'email', 'you@example.com')}
            {field('phone', 'Mobile number (optional)', 'tel', '9876543210')}
            {field('password', 'Password', 'password', 'Minimum 6 characters')}
            {field('confirm', 'Confirm password', 'password')}
            <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
              <UserPlus size={16} /> {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already registered? <Link to="/login" className="font-semibold text-primary-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

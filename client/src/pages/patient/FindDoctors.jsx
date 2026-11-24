import { useEffect, useMemo, useState } from 'react';
import { Search, Stethoscope, X } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import { useHospitalRoom } from '../../context/SocketContext';
import LiveIndicator from '../../components/LiveIndicator';
import DoctorCard from '../../components/DoctorCard';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** Search doctors by name and filter by department / specialization. */
export default function FindDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [filters, setFilters] = useState({ search: '', department: '', specialization: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter options (loaded once)
  useEffect(() => {
    Promise.all([api.get('/departments'), api.get('/doctors/specializations')])
      .then(([d, s]) => {
        setDepartments(d.data);
        setSpecializations(s.data);
      })
      .catch(() => {});
  }, []);

  // Debounce typing in the search box
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/doctors', { params: { search: debouncedSearch, department: filters.department, specialization: filters.specialization } })
      .then((res) => !cancelled && (setDoctors(res.data), setError('')))
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, filters.department, filters.specialization]);

  // Live: status changes and queue movements update the cards without refresh
  useHospitalRoom({
    'doctor:statusChanged': (view) =>
      setDoctors((list) => list.map((d) => (d._id === view._id ? { ...d, ...view } : d))),
    'queue:updated': (snap) =>
      setDoctors((list) =>
        list.map((d) =>
          d._id === snap.doctorId
            ? { ...d, queue: { nowServing: snap.nowServing, waiting: snap.counts.waiting, total: snap.counts.total, completed: snap.counts.completed } }
            : d
        )
      ),
  });

  const availableCount = useMemo(() => doctors.filter((d) => d.status === 'available').length, [doctors]);
  const hasFilters = filters.search || filters.department || filters.specialization;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Find a Doctor"
        subtitle="Live availability and OPD queue status at City Care Multispeciality Hospital (Demo)"
        actions={<LiveIndicator />}
      />

      <div className="card mb-6 grid gap-3 p-4 md:grid-cols-[1fr_220px_240px_auto]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by doctor name or specialization..." value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })} aria-label="Search doctors" />
        </div>
        <select className="input" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} aria-label="Department">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="input" value={filters.specialization} onChange={(e) => setFilters({ ...filters, specialization: e.target.value })} aria-label="Specialization">
          <option value="">All specializations</option>
          {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {hasFilters && (
          <button className="btn-ghost" onClick={() => setFilters({ search: '', department: '', specialization: '' })}><X size={16} /> Clear</button>
        )}
      </div>

      {!loading && !error && (
        <p className="mb-4 text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{doctors.length}</span> doctors ·{' '}
          <span className="font-semibold text-emerald-600">{availableCount} available now</span>
        </p>
      )}

      {loading ? (
        <Loader label="Fetching live doctor availability..." />
      ) : error ? (
        <EmptyState title="Could not load doctors" message={error} />
      ) : doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors found" message="Try a different name, department or specialization." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {doctors.map((d) => <DoctorCard key={d._id} doctor={d} />)}
        </div>
      )}
    </div>
  );
}

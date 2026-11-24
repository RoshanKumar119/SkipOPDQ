import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Stethoscope } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';

const EMPTY = {
  name: '', email: '', phone: '', department: '', specialization: '', qualification: '',
  experienceYears: '', roomNumber: '', avgConsultationMinutes: 10,
};

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.get('/doctors'), api.get('/departments')])
      .then(([doc, dep]) => {
        setDoctors([...doc.data].sort((a, b) => a.name.localeCompare(b.name)));
        setDepartments(dep.data);
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openEdit = (d) =>
    setModal({
      mode: 'edit',
      data: {
        _id: d._id, name: d.name, email: d.email, phone: d.phone || '', department: d.department?._id || '',
        specialization: d.specialization, qualification: d.qualification || '', experienceYears: d.experienceYears ?? '',
        roomNumber: d.roomNumber || '', avgConsultationMinutes: d.avgConsultationMinutes,
      },
    });

  const setField = (k, v) => setModal((m) => ({ ...m, data: { ...m.data, [k]: v } }));

  const save = async (e) => {
    e.preventDefault();
    const { mode, data } = modal;
    if (!data.name.trim() || !data.email.trim() || !data.department || !data.specialization.trim()) {
      return toast.error('Name, email, department and specialization are required');
    }
    const avg = Number(data.avgConsultationMinutes);
    if (!avg || avg < 3 || avg > 60) return toast.error('Average consultation time must be 3–60 minutes');
    setSaving(true);
    try {
      if (mode === 'add') {
        const res = await api.post('/doctors', data);
        toast.success(res.data.message, { duration: 6000 });
      } else {
        await api.put(`/doctors/${data._id}`, data);
        toast.success('Doctor details updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const input = (key, label, props = {}) => (
    <div>
      <label className="label" htmlFor={`doc-${key}`}>{label}</label>
      <input id={`doc-${key}`} className="input" value={modal.data[key]} onChange={(e) => setField(key, e.target.value)} {...props} />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Doctors"
        subtitle="Add doctors (a login account is created automatically) and edit their details."
        actions={<button className="btn-primary" onClick={() => setModal({ mode: 'add', data: EMPTY })}><Plus size={16} /> Add Doctor</button>}
      />

      {loading ? <Loader /> : doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors yet" message="Add your first doctor to start running OPD queues." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Doctor</th>
                <th className="table-th">Department</th>
                <th className="table-th">Room</th>
                <th className="table-th">Avg. consult</th>
                <th className="table-th">Status</th>
                <th className="table-th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.map((d) => (
                <tr key={d._id} className="hover:bg-slate-50">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <Avatar name={d.name} initials={d.initials} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-900">{d.name}</p>
                        <p className="text-xs text-slate-500">{d.specialization} · {d.qualification}</p>
                        <p className="text-xs text-slate-400">{d.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">{d.department?.name}</td>
                  <td className="table-td">{d.roomNumber || '—'}</td>
                  <td className="table-td">{d.avgConsultationMinutes} min</td>
                  <td className="table-td"><StatusBadge status={d.status} /></td>
                  <td className="table-td text-right">
                    <button className="btn-ghost p-2" title="Edit doctor" onClick={() => openEdit(d)}><Pencil size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} title={modal?.mode === 'add' ? 'Add Doctor' : 'Edit Doctor'} onClose={() => setModal(null)} maxWidth="max-w-2xl">
        {modal && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {input('name', 'Full name *', { placeholder: 'Dr. Pooja Menon' })}
              {input('email', 'Email (login) *', { type: 'email', placeholder: 'pooja.menon@skipopdq.demo' })}
              {input('phone', 'Phone', { placeholder: '98220 12345' })}
              <div>
                <label className="label" htmlFor="doc-dept">Department *</label>
                <select id="doc-dept" className="input" value={modal.data.department} onChange={(e) => setField('department', e.target.value)}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              {input('specialization', 'Specialization *', { placeholder: 'Neurologist' })}
              {input('qualification', 'Qualification', { placeholder: 'MBBS, MD, DM (Neurology)' })}
              {input('experienceYears', 'Experience (years)', { type: 'number', min: 0, max: 60 })}
              {input('roomNumber', 'OPD room', { placeholder: 'OPD-401' })}
              {input('avgConsultationMinutes', 'Avg. consultation (minutes) *', { type: 'number', min: 3, max: 60 })}
            </div>
            {modal.mode === 'add' && (
              <p className="rounded-xl bg-primary-50 px-3 py-2 text-sm text-primary-700">
                A doctor login will be created with the default password <b>doctor123</b>.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Doctor'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

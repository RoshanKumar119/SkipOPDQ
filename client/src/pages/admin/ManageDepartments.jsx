import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, MapPin, Pencil, Plus } from 'lucide-react';
import api, { errorMessage } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const EMPTY = { name: '', description: '', location: '' };

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', data }
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/departments')
      .then((res) => setDepartments(res.data))
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const save = async (e) => {
    e.preventDefault();
    const { data, mode } = modal;
    if (!data.name.trim()) return toast.error('Department name is required');
    setSaving(true);
    try {
      if (mode === 'add') await api.post('/departments', data);
      else await api.put(`/departments/${data._id}`, data);
      toast.success(mode === 'add' ? 'Department added' : 'Department updated');
      setModal(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const setField = (k, v) => setModal((m) => ({ ...m, data: { ...m.data, [k]: v } }));

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Hospital departments shown to patients when searching for doctors."
        actions={<button className="btn-primary" onClick={() => setModal({ mode: 'add', data: EMPTY })}><Plus size={16} /> Add Department</button>}
      />

      {loading ? <Loader /> : departments.length === 0 ? (
        <EmptyState icon={Building2} title="No departments yet" message="Add the first department to start adding doctors." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => (
            <div key={d._id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary-50 p-2.5 text-primary-500"><Building2 size={20} /></div>
                  <h3 className="font-bold text-slate-900">{d.name}</h3>
                </div>
                <button className="btn-ghost p-2" title="Edit" onClick={() => setModal({ mode: 'edit', data: { ...EMPTY, ...d } })}><Pencil size={16} /></button>
              </div>
              <p className="mt-3 flex-1 text-sm text-slate-600">{d.description || 'No description'}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin size={13} /> {d.location || 'Location not set'}</span>
                <span className="font-semibold text-primary-600">{d.doctorCount} doctor{d.doctorCount === 1 ? '' : 's'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} title={modal?.mode === 'add' ? 'Add Department' : 'Edit Department'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label" htmlFor="dname">Name *</label>
              <input id="dname" className="input" value={modal.data.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Neurology" />
            </div>
            <div>
              <label className="label" htmlFor="ddesc">Description</label>
              <textarea id="ddesc" rows={3} className="input" value={modal.data.description} onChange={(e) => setField('description', e.target.value)} placeholder="What conditions does this department treat?" />
            </div>
            <div>
              <label className="label" htmlFor="dloc">Floor / Location</label>
              <input id="dloc" className="input" value={modal.data.location} onChange={(e) => setField('location', e.target.value)} placeholder="e.g. 4th Floor, Wing B" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

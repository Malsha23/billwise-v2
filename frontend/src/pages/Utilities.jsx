import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const TYPES = ['electricity', 'water', 'gas'];
const empty = { type: 'electricity', provider: '', accountNumber: '', meterNumber: '' };

function Fields({ form, setForm }) {
  return (
    <>
      <select className="rounded border p-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input className="rounded border p-2" required placeholder="Provider" value={form.provider}
        onChange={(e) => setForm({ ...form, provider: e.target.value })} />
      <input className="rounded border p-2" required placeholder="Account number" value={form.accountNumber}
        onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
      <input className="rounded border p-2" placeholder="Meter number (optional)" value={form.meterNumber}
        onChange={(e) => setForm({ ...form, meterNumber: e.target.value })} />
    </>
  );
}

export default function Utilities() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [error, setError] = useState('');

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(empty);
  const [modalError, setModalError] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/utilities', { params: { search, type, sort } });
      setItems(res.data.utilities);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      else setError(errMsg(err));
    }
  };

  useEffect(() => {
    load();
  }, [search, type, sort]);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/utilities', form);
      setForm(empty);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const openEdit = (u) => {
    setModalError('');
    setEditId(u._id);
    setEditForm({ type: u.type, provider: u.provider, accountNumber: u.accountNumber, meterNumber: u.meterNumber });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/utilities/${editId}`, editForm);
      setEditId(null);
      load();
    } catch (err) {
      setModalError(errMsg(err));
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/utilities/${toDelete._id}`);
      setToDelete(null);
      load();
    } catch (err) {
      setToDelete(null);
      setError(errMsg(err));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Utilities</h1>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={add} className="grid gap-3 rounded-xl bg-white p-4 shadow sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Add utility</h2>
        <Fields form={form} setForm={setForm} />
        <div className="sm:col-span-2">
          <button className="rounded bg-blue-500 px-4 py-2 font-semibold text-white">Add</button>
        </div>
      </form>

      <div className="flex flex-wrap gap-3">
        <input className="rounded border p-2" placeholder="Search provider or account" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <select className="rounded border p-2" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="rounded border p-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="provider">Provider A to Z</option>
          <option value="-provider">Provider Z to A</option>
          <option value="type">Type</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Account</th>
              <th className="p-3">Meter</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u._id} className="border-b">
                <td className="p-3 capitalize">{u.type}</td>
                <td className="p-3">{u.provider}</td>
                <td className="p-3">{u.accountNumber}</td>
                <td className="p-3">{u.meterNumber || '-'}</td>
                <td className="flex gap-3 p-3">
                  <button onClick={() => openEdit(u)} className="text-blue-500">Edit</button>
                  <button onClick={() => setToDelete(u)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-center text-gray-500">No utilities found.</p>}
      </div>

      {editId && (
        <Modal title="Edit utility" onClose={() => setEditId(null)}>
          <form onSubmit={saveEdit} className="space-y-3">
            {modalError && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{modalError}</p>}
            <Fields form={editForm} setForm={setEditForm} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditId(null)} className="rounded border px-4 py-2">Cancel</button>
              <button className="rounded bg-blue-500 px-4 py-2 font-semibold text-white">Update</button>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog title="Delete utility" onConfirm={confirmDelete} onCancel={() => setToDelete(null)}>
          <p>Are you sure you want to delete this utility? Its readings and bills will be deleted too.</p>
          <ul className="mt-2 space-y-1">
            <li>Type: <b className="capitalize">{toDelete.type}</b></li>
            <li>Provider: <b>{toDelete.provider}</b></li>
            <li>Account: <b>{toDelete.accountNumber}</b></li>
          </ul>
        </ConfirmDialog>
      )}
    </div>
  );
}
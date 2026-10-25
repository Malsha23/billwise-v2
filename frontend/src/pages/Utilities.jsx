import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';

const TYPES = ['electricity', 'water', 'gas'];
const empty = { type: 'electricity', provider: '', accountNumber: '', meterNumber: '' };

export default function Utilities() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('-createdAt');

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

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api.put(`/utilities/${editingId}`, form);
      else await api.post('/utilities', form);
      setForm(empty);
      setEditingId(null);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setForm({ type: u.type, provider: u.provider, accountNumber: u.accountNumber, meterNumber: u.meterNumber });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty);
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.provider} (${u.type})?`)) return;
    try {
      await api.delete(`/utilities/${u._id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Utilities</h1>
        <Link to="/" className="text-blue-500">Back to home</Link>
      </div>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={submit} className="grid gap-3 rounded-xl bg-white p-4 shadow sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">{editingId ? 'Edit utility' : 'Add utility'}</h2>
        <select className="rounded border p-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="rounded border p-2" required placeholder="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
        <input className="rounded border p-2" required placeholder="Account number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
        <input className="rounded border p-2" placeholder="Meter number (optional)" value={form.meterNumber} onChange={(e) => setForm({ ...form, meterNumber: e.target.value })} />
        <div className="flex gap-2 sm:col-span-2">
          <button className="rounded bg-blue-500 px-4 py-2 font-semibold text-white">{editingId ? 'Save changes' : 'Add'}</button>
          {editingId && <button type="button" onClick={cancelEdit} className="rounded border px-4 py-2">Cancel</button>}
        </div>
      </form>

      <div className="flex flex-wrap gap-3">
        <input className="rounded border p-2" placeholder="Search provider or account" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                  <button onClick={() => startEdit(u)} className="text-blue-500">Edit</button>
                  <button onClick={() => remove(u)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-center text-gray-500">No utilities found.</p>}
      </div>
    </div>
  );
}
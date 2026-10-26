import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';

const blank = { name: '', email: '', password: '', role: 'user' };

export default function Admin() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const fail = (err) => {
    if (err.response?.status === 401) navigate('/login');
    else setError(errMsg(err));
  };

  useEffect(() => {
    api.get('/auth/me').then((r) => {
      if (r.data.user.role !== 'admin') navigate('/');
      else setMe(r.data.user);
    }).catch(fail);
  }, []);

  const load = () =>
    api.get('/admin/users', { params: { search, role } }).then((r) => setUsers(r.data.users)).catch(fail);

  useEffect(() => {
    if (me) load();
  }, [me, search, role]);

  const reset = () => {
    setEditingId(null);
    setForm(blank);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api.put(`/admin/users/${editingId}`, { name: form.name, role: form.role });
      else await api.post('/admin/users', form);
      reset();
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.name} and all of their data?`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (!me) return <p className="p-6">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin: users</h1>
        <Link to="/" className="text-blue-500">Back to home</Link>
      </div>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={submit} className="grid gap-3 rounded-xl bg-white p-4 shadow sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">{editingId ? 'Edit user' : 'Add user'}</h2>
        <input className="rounded border p-2" required placeholder="Full name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input type="email" className="rounded border p-2 disabled:bg-gray-100" required placeholder="Email"
          disabled={!!editingId} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        {!editingId && (
          <input type="password" minLength={6} required className="rounded border p-2" placeholder="Password (min 6 characters)"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        )}
        <select className="rounded border p-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex gap-2 sm:col-span-2">
          <button className="rounded bg-blue-500 px-4 py-2 font-semibold text-white">{editingId ? 'Save changes' : 'Add'}</button>
          {editingId && <button type="button" onClick={reset} className="rounded border px-4 py-2">Cancel</button>}
        </div>
      </form>

      <div className="flex flex-wrap gap-3">
        <input className="rounded border p-2" placeholder="Search name or email" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <select className="rounded border p-2" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="flex gap-3 p-3">
                  <button onClick={() => startEdit(u)} className="text-blue-500">Edit</button>
                  {u._id !== me._id && <button onClick={() => remove(u)} className="text-red-500">Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-6 text-center text-gray-500">No users found.</p>}
      </div>
    </div>
  );
}
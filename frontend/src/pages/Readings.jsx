import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';

const UNITS = { electricity: 'kWh', water: 'm³', gas: 'm³' };
const today = () => new Date().toISOString().slice(0, 10);

export default function Readings() {
  const navigate = useNavigate();
  const [utilities, setUtilities] = useState([]);
  const [utilityId, setUtilityId] = useState('');
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState('-date');
  const [form, setForm] = useState({ date: today(), reading: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const fail = (err) => {
    if (err.response?.status === 401) navigate('/login');
    else setError(errMsg(err));
  };

  useEffect(() => {
    api
      .get('/utilities')
      .then((r) => {
        setUtilities(r.data.utilities);
        if (r.data.utilities.length) setUtilityId(r.data.utilities[0]._id);
      })
      .catch(fail);
  }, []);

  const load = async () => {
    if (!utilityId) return;
    try {
      const res = await api.get('/readings', { params: { utility: utilityId, sort } });
      setItems(res.data.readings);
    } catch (err) {
      fail(err);
    }
  };

  useEffect(() => {
    load();
  }, [utilityId, sort]);

  const current = utilities.find((u) => u._id === utilityId);
  const unit = current ? UNITS[current.type] : '';

  const reset = () => {
    setEditingId(null);
    setForm({ date: today(), reading: '' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api.put(`/readings/${editingId}`, form);
      else await api.post('/readings', { ...form, utility: utilityId });
      reset();
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setForm({ date: r.date.slice(0, 10), reading: r.reading });
  };

  const remove = async (r) => {
    if (!confirm('Delete this reading?')) return;
    try {
      await api.delete(`/readings/${r._id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (utilities.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-gray-600">Add a utility first, then record its meter readings.</p>
        <Link to="/utilities" className="text-blue-500">Go to utilities</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meter readings</h1>
        <Link to="/" className="text-blue-500">Back to home</Link>
      </div>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <select
          className="rounded border p-2"
          value={utilityId}
          onChange={(e) => { setUtilityId(e.target.value); reset(); }}
        >
          {utilities.map((u) => (
            <option key={u._id} value={u._id}>{u.type} - {u.provider}</option>
          ))}
        </select>
        <select className="rounded border p-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="-date">Newest first</option>
          <option value="date">Oldest first</option>
          <option value="-reading">Highest reading</option>
          <option value="reading">Lowest reading</option>
        </select>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-xl bg-white p-4 shadow sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">{editingId ? 'Edit reading' : 'Add reading'}</h2>
        <input
          type="date" required className="rounded border p-2"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          type="number" step="any" min="0" required
          placeholder={`Meter reading (${unit})`}
          className="rounded border p-2"
          value={form.reading}
          onChange={(e) => setForm({ ...form, reading: e.target.value })}
        />
        <div className="flex gap-2 sm:col-span-2">
          <button className="rounded bg-blue-500 px-4 py-2 font-semibold text-white">
            {editingId ? 'Save changes' : 'Add'}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="rounded border px-4 py-2">Cancel</button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Reading</th>
              <th className="p-3">Usage</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id} className="border-b">
                <td className="p-3">{r.date.slice(0, 10)}</td>
                <td className="p-3">{r.reading}</td>
                <td className="p-3">{r.usage} {unit}</td>
                <td className="flex gap-3 p-3">
                  <button onClick={() => startEdit(r)} className="text-blue-500">Edit</button>
                  <button onClick={() => remove(r)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-center text-gray-500">No readings yet.</p>}
      </div>
    </div>
  );
}
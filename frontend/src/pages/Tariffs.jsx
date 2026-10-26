import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { money } from '../lib/format';

const TYPES = ['electricity', 'water', 'gas'];
const UNITS = { electricity: 'kWh', water: 'm³', gas: 'm³' };
const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ utilityType: 'electricity', unit: 'kWh', ratePerUnit: '', fixedCharge: 0, effectiveFrom: today() });

export default function Tariffs() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tariffs, setTariffs] = useState([]);
  const [form, setForm] = useState(blank());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const fail = (err) => {
    if (err.response?.status === 401) navigate('/login');
    else setError(errMsg(err));
  };

  const load = () =>
    api.get('/tariffs').then((r) => setTariffs(r.data.tariffs)).catch(fail);

  useEffect(() => {
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(fail);
    load();
  }, []);

  const isAdmin = user?.role === 'admin';

  const reset = () => {
    setEditingId(null);
    setForm(blank());
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api.put(`/tariffs/${editingId}`, form);
      else await api.post('/tariffs', form);
      reset();
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const startEdit = (t) => {
    setEditingId(t._id);
    setForm({
      utilityType: t.utilityType,
      unit: t.unit,
      ratePerUnit: t.ratePerUnit,
      fixedCharge: t.fixedCharge,
      effectiveFrom: t.effectiveFrom.slice(0, 10),
    });
  };

  const remove = async (t) => {
    if (!confirm('Delete this tariff?')) return;
    try {
      await api.delete(`/tariffs/${t._id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tariffs</h1>
        <Link to="/" className="text-blue-500">Back to home</Link>
      </div>

      <p className="text-sm text-gray-600">
        The newest tariff that started on or before the billing month is used to calculate a bill:
        usage × rate + fixed charge.
      </p>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      {isAdmin ? (
        <form onSubmit={submit} className="grid gap-3 rounded-xl bg-white p-4 shadow sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">{editingId ? 'Edit tariff' : 'Add tariff'}</h2>
          <select className="rounded border p-2" value={form.utilityType}
            onChange={(e) => setForm({ ...form, utilityType: e.target.value, unit: UNITS[e.target.value] })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="rounded border p-2" required placeholder="Unit (kWh, m³)" value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input type="number" step="any" min="0" required className="rounded border p-2" placeholder="Rate per unit"
            value={form.ratePerUnit} onChange={(e) => setForm({ ...form, ratePerUnit: e.target.value })} />
          <input type="number" step="any" min="0" className="rounded border p-2" placeholder="Fixed monthly charge"
            value={form.fixedCharge} onChange={(e) => setForm({ ...form, fixedCharge: e.target.value })} />
          <input type="date" required className="rounded border p-2" value={form.effectiveFrom}
            onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
          <div className="flex gap-2 sm:col-span-2">
            <button className="rounded bg-blue-500 px-4 py-2 font-semibold text-white">{editingId ? 'Save changes' : 'Add'}</button>
            {editingId && <button type="button" onClick={reset} className="rounded border px-4 py-2">Cancel</button>}
          </div>
        </form>
      ) : (
        <p className="rounded bg-gray-100 p-3 text-sm text-gray-600">Only an admin can change tariffs.</p>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="p-3">Utility</th>
              <th className="p-3">Rate per unit</th>
              <th className="p-3">Fixed charge</th>
              <th className="p-3">Effective from</th>
              {isAdmin && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {tariffs.map((t) => (
              <tr key={t._id} className="border-b">
                <td className="p-3 capitalize">{t.utilityType}</td>
                <td className="p-3">{money(t.ratePerUnit)} / {t.unit}</td>
                <td className="p-3">{money(t.fixedCharge)}</td>
                <td className="p-3">{t.effectiveFrom.slice(0, 10)}</td>
                {isAdmin && (
                  <td className="flex gap-3 p-3">
                    <button onClick={() => startEdit(t)} className="text-blue-500">Edit</button>
                    <button onClick={() => remove(t)} className="text-red-500">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {tariffs.length === 0 && <p className="p-6 text-center text-gray-500">No tariffs yet. Default rates are used.</p>}
      </div>
    </div>
  );
}
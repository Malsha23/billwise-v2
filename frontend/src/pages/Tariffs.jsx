import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { money, UNITS } from '../lib/format';

const TYPES = ['electricity', 'water', 'gas'];
const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({
  utilityType: 'electricity',
  unit: UNITS.electricity,
  ratePerUnit: '',
  fixedCharge: 0,
  effectiveFrom: today(),
  blocks: [],
});

// "from" of each block is the previous "to" plus 1
const withFrom = (blocks) =>
  blocks.map((b, i) => ({ ...b, from: i === 0 ? 1 : Number(blocks[i - 1].to) + 1 }));

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

  const load = () => api.get('/tariffs').then((r) => setTariffs(r.data.tariffs)).catch(fail);

  useEffect(() => {
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(fail);
    load();
  }, []);

  const isAdmin = user?.role === 'admin';
  const useBlocks = form.blocks.length > 0;
  const shown = withFrom(form.blocks);

  const reset = () => {
    setEditingId(null);
    setForm(blank());
  };

  const toggleBlocks = (on) =>
    setForm({ ...form, blocks: on ? [{ to: '', rate: '' }] : [] });

  const setBlock = (i, key, value) =>
    setForm({ ...form, blocks: form.blocks.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)) });

  const addBlock = () => setForm({ ...form, blocks: [...form.blocks, { to: '', rate: '' }] });
  const removeBlock = (i) => setForm({ ...form, blocks: form.blocks.filter((_, idx) => idx !== i) });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      blocks: shown.map((b) => ({ from: b.from, to: b.to === '' ? null : Number(b.to), rate: b.rate })),
    };
    try {
      if (editingId) await api.put(`/tariffs/${editingId}`, payload);
      else await api.post('/tariffs', payload);
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
      blocks: (t.blocks || []).map((b) => ({ to: b.to ?? '', rate: b.rate })),
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
      <h1 className="text-2xl font-semibold">Tariffs</h1>

      <p className="text-sm text-gray-600">
        The newest tariff that started on or before the billing month is used. A bill is the usage
        charge (single rate or block rates) plus the fixed charge.
      </p>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      {isAdmin ? (
        <form onSubmit={submit} className="grid gap-3 rounded-xl bg-white p-4 shadow sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">{editingId ? 'Edit tariff' : 'Add tariff'}</h2>
          <select className="rounded border p-2" value={form.utilityType}
            onChange={(e) => setForm({ ...form, utilityType: e.target.value, unit: UNITS[e.target.value] })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="rounded border p-2" required placeholder="Unit" value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })} />

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={useBlocks} onChange={(e) => toggleBlocks(e.target.checked)} />
            Block (tiered) rates
          </label>

          {useBlocks ? (
            <div className="space-y-2 sm:col-span-2">
              {shown.map((b, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-sm text-gray-600">From {b.from}</span>
                  <input type="number" min={b.from} step="any" className="w-28 rounded border p-2"
                    placeholder="To (blank = no limit)" value={form.blocks[i].to}
                    onChange={(e) => setBlock(i, 'to', e.target.value)} />
                  <input type="number" min="0" step="any" required className="w-28 rounded border p-2"
                    placeholder="Rate" value={form.blocks[i].rate}
                    onChange={(e) => setBlock(i, 'rate', e.target.value)} />
                  {form.blocks.length > 1 && (
                    <button type="button" onClick={() => removeBlock(i)} className="text-sm text-red-500">Remove</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addBlock} className="text-sm text-blue-500">+ Add block</button>
              <p className="text-xs text-gray-500">
                Leave "To" empty on the last block for no upper limit. If the last block has a limit,
                units above it are charged at that block's rate.
              </p>
            </div>
          ) : (
            <input type="number" step="any" min="0" required className="rounded border p-2"
              placeholder="Rate per unit" value={form.ratePerUnit}
              onChange={(e) => setForm({ ...form, ratePerUnit: e.target.value })} />
          )}

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
              <th className="p-3">Rate</th>
              <th className="p-3">Fixed charge</th>
              <th className="p-3">Effective from</th>
              {isAdmin && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {tariffs.map((t) => (
              <tr key={t._id} className="border-b align-top">
                <td className="p-3 capitalize">{t.utilityType}</td>
                <td className="p-3">
                  {t.blocks?.length
                    ? t.blocks.map((b) => (
                        <div key={b.from}>{b.from} to {b.to ?? 'no limit'} {t.unit}: {money(b.rate)}</div>
                      ))
                    : `${money(t.ratePerUnit)} / ${t.unit}`}
                </td>
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
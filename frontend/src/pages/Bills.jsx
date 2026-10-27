import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { money, periodLabel } from '../lib/format';

const TYPES = ['electricity', 'water', 'gas'];
const thisMonth = () => new Date().toISOString().slice(0, 7);
const YEARS = Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() - i));

export default function Bills() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [sort, setSort] = useState('-period');
  const [gen, setGen] = useState({ period: thisMonth(), type: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const fail = (err) => {
    if (err.response?.status === 401) navigate('/login');
    else setError(errMsg(err));
  };

  const load = async () => {
    try {
      const res = await api.get('/bills', { params: { type, status, year, sort } });
      setBills(res.data.bills);
    } catch (err) {
      fail(err);
    }
  };

  useEffect(() => {
    load();
  }, [type, status, year, sort]);

  const generate = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      const res = await api.post('/bills/generate', gen);
      setInfo(`${res.data.bills.length} bill(s) generated for ${periodLabel(gen.period)}`);
      if (year !== gen.period.slice(0, 4)) setYear(gen.period.slice(0, 4));
      else load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const pay = async (b) => {
    try {
      await api.patch(`/bills/${b._id}/pay`);
      load();
    } catch (err) {
      fail(err);
    }
  };

  const remove = async (b) => {
    if (!confirm(`Delete the ${b.type} bill for ${periodLabel(b.period)}?`)) return;
    try {
      await api.delete(`/bills/${b._id}`);
      load();
    } catch (err) {
      fail(err);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bills</h1>
        
      </div>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {info && <p className="rounded bg-green-50 p-2 text-sm text-green-700">{info}</p>}

      <form onSubmit={generate} className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow">
        <div>
          <label className="block text-xs text-gray-500">Billing month</label>
          <input type="month" required className="rounded border p-2" value={gen.period}
            onChange={(e) => setGen({ ...gen, period: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Utility</label>
          <select className="rounded border p-2" value={gen.type} onChange={(e) => setGen({ ...gen, type: e.target.value })}>
            <option value="">All utilities</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button className="rounded bg-blue-500 px-4 py-2 font-semibold text-white">Generate bill</button>
      </form>

      <div className="flex flex-wrap gap-3">
        <select className="rounded border p-2" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
        <select className="rounded border p-2" value={year} onChange={(e) => setYear(e.target.value)}>
          {YEARS.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select className="rounded border p-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="-period">Newest first</option>
          <option value="period">Oldest first</option>
          <option value="-amount">Highest amount</option>
          <option value="amount">Lowest amount</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="p-3">Period</th>
              <th className="p-3">Utility</th>
              <th className="p-3">Usage</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b._id} className="border-b">
                <td className="p-3">{periodLabel(b.period)}</td>
                <td className="p-3 capitalize">{b.type}{b.utility?.provider ? ` (${b.utility.provider})` : ''}</td>
                <td className="p-3">{b.usage}</td>
                <td className="p-3 font-medium">{money(b.amount)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${b.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {b.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </td>
                <td className="flex gap-3 p-3">
                  {b.status === 'pending' && <button onClick={() => pay(b)} className="text-blue-500">Mark as paid</button>}
                  <button onClick={() => remove(b)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && <p className="p-6 text-center text-gray-500">No bills found. Generate one from your meter readings.</p>}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../lib/api';
import { money, monthLabel, periodLabel } from '../lib/format';

const META = {
  electricity: { label: 'Electricity', color: '#10B981' },
  water: { label: 'Water', color: '#3B82F6' },
  gas: { label: 'Gas', color: '#F59E0B' },
};

export default function Analytics() {
  const navigate = useNavigate();
  const [months, setMonths] = useState(6);
  const [cost, setCost] = useState([]);
  const [breakdown, setBreakdown] = useState({ total: 0, breakdown: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/cost', { params: { months } }),
      api.get('/dashboard/breakdown', { params: { months } }),
    ])
      .then(([c, b]) => {
        setCost(c.data.data);
        setBreakdown(b.data);
        setError('');
      })
      .catch((err) => {
        if (err.response?.status === 401) navigate('/login');
        else setError(errMsg(err));
      });
  }, [months, navigate]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="flex items-center gap-4">
          <select className="rounded border p-2" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {[3, 6, 12].map((m) => <option key={m} value={m}>Last {m} months</option>)}
          </select>
          <Link to="/" className="text-blue-500">Back to home</Link>
        </div>
      </div>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-4 text-sm font-semibold">Monthly cost</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cost}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={periodLabel} formatter={(v) => money(v)} />
                <Legend />
                {Object.entries(META).map(([key, m]) => (
                  <Bar key={key} dataKey={key} name={m.label} stackId="a" fill={m.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-4 text-sm font-semibold">Cost breakdown</h2>
          <div className="relative h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown.breakdown} dataKey="amount" nameKey="type" innerRadius={50} outerRadius={75} paddingAngle={2}>
                  {breakdown.breakdown.map((b) => <Cell key={b.type} fill={META[b.type].color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm font-semibold">{money(breakdown.total)}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {breakdown.breakdown.map((b) => (
              <li key={b.type} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: META[b.type].color }} />
                  {META[b.type].label}
                </span>
                <span className="text-gray-500">{b.percent}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
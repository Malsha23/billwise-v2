import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../lib/api';
import { money, monthLabel, periodLabel } from '../lib/format';

const META = {
  electricity: { label: 'Electricity', color: '#10B981', bg: 'bg-emerald-100' },
  water: { label: 'Water', color: '#3B82F6', bg: 'bg-blue-100' },
  gas: { label: 'Gas', color: '#F59E0B', bg: 'bg-amber-100' },
};



export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/auth/me'), api.get('/dashboard/summary')])
      .then(([me, summary]) => {
        setUser(me.data.user);
        setData(summary.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) navigate('/login');
        else setError(errMsg(err));
      });
  }, [navigate]);

 

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!user || !data) return <p className="p-6">Loading…</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
    <div>
  <h1 className="text-2xl font-semibold">Hello, {user.name.split(' ')[0]}</h1>
  <p className="text-sm text-gray-600">Here is your home utility overview.</p>
    </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.cards.map((c) => (
          <div key={c.type} className={`rounded-xl p-5 shadow ${META[c.type].bg}`}>
            <p className="text-sm text-gray-600">{META[c.type].label}</p>
            <p className="text-xl font-semibold">{money(c.amount)}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
              <span>{c.period ? periodLabel(c.period) : 'No bills yet'}</span>
              <span className={c.change > 0 ? 'text-red-500' : 'text-green-600'}>
                {c.change > 0 ? '▲' : c.change < 0 ? '▼' : ''} {Math.abs(c.change)}%
              </span>
            </div>
          </div>
        ))}
        <div className="rounded-xl bg-violet-100 p-5 shadow">
          <p className="text-sm text-gray-600">Total bill</p>
          <p className="text-xl font-semibold">{money(data.total)}</p>
          <p className="mt-2 text-xs text-gray-600">Latest bills combined</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-4 text-sm font-semibold">Monthly utility usage</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.usage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={periodLabel} />
                <Legend />
                {Object.entries(META).map(([key, m]) => (
                  <Line key={key} type="monotone" dataKey={key} name={m.label} stroke={m.color} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent bills</h2>
            <Link to="/bills" className="text-xs text-blue-500">View all</Link>
          </div>
          {data.recentBills.length === 0 && <p className="text-sm text-gray-500">No bills yet.</p>}
          <ul className="space-y-3">
            {data.recentBills.map((b) => (
              <li key={b._id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">{b.type}</p>
                  <p className="text-xs text-gray-500">{periodLabel(b.period)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{money(b.amount)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${b.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {b.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
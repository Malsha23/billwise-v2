import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import PasswordInput from '../components/PasswordInput';

const inputCls =
  'w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/login', form);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">Billwise</h1>
          <p className="mt-1 text-sm text-slate-400">Smart Home Utility Manager</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white">Welcome back</h2>
          {error && <p role="alert" className="rounded-lg bg-red-950 p-2 text-sm text-red-300">{error}</p>}

          <div>
            <label className="mb-1 block text-sm text-slate-300">Email</label>
            <input type="email" required placeholder="you@example.com" className={inputCls}
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Password</label>
            <PasswordInput required placeholder="Enter your password"
              className="!rounded-lg !border-slate-600 !bg-slate-800 !p-3 !pr-10 text-white placeholder-slate-400"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          <button className="w-full rounded-lg bg-blue-500 p-3 font-semibold text-white hover:bg-blue-600">Log in</button>

          <p className="text-center text-sm text-slate-400">
            Don't have an account? <Link to="/register" className="text-blue-400">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
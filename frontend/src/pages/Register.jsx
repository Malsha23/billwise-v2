import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import PasswordInput from '../components/PasswordInput';

const inputCls =
  'w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none';
const pwCls = '!rounded-lg !border-slate-600 !bg-slate-800 !p-3 !pr-10 text-white placeholder-slate-400';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.name.trim().length < 2) return setError('Name must be at least 2 characters');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');

    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
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
          <p className="mt-1 text-sm text-slate-400">Track · Manage · Save</p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white">Create account</h2>
          {error && <p role="alert" className="rounded-lg bg-red-950 p-2 text-sm text-red-300">{error}</p>}

          <input className={inputCls} placeholder="Full name" value={form.name} onChange={set('name')} />
          <input type="email" className={inputCls} placeholder="Email" value={form.email} onChange={set('email')} />
          <PasswordInput className={pwCls} placeholder="Password (min 6 characters)" value={form.password} onChange={set('password')} />
          <PasswordInput className={pwCls} placeholder="Confirm password" value={form.confirm} onChange={set('confirm')} />

          <button className="w-full rounded-lg bg-blue-500 p-3 font-semibold text-white hover:bg-blue-600">Register</button>

          <p className="text-center text-sm text-slate-400">
            Already have an account? <Link to="/login" className="text-blue-400">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
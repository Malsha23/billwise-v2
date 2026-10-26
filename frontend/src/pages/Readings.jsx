import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api';

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
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={submit} noValidate className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Create account</h1>
        {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <input className="w-full rounded border p-2" placeholder="Full name" value={form.name} onChange={set('name')} />
        <input type="email" className="w-full rounded border p-2" placeholder="Email" value={form.email} onChange={set('email')} />
        <input type="password" className="w-full rounded border p-2" placeholder="Password (min 6 characters)" value={form.password} onChange={set('password')} />
        <input type="password" className="w-full rounded border p-2" placeholder="Confirm password" value={form.confirm} onChange={set('confirm')} />
        <button className="w-full rounded bg-blue-500 p-2 font-semibold text-white">Register</button>
        <p className="text-center text-sm">
          Already have an account? <Link to="/login" className="text-blue-500">Login</Link>
        </p>
      </form>
    </div>
  );
}
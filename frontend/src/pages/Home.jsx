import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => navigate('/login'));
  }, [navigate]);

  const logout = async () => {
    await api.post('/auth/logout');
    navigate('/login');
  };

  if (!user) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Hello, {user.name}</h1>
      <p className="text-gray-600">{user.email}</p>
      <Link to="/utilities" className="mt-4 inline-block text-blue-500">Manage utilities</Link>
      <Link to="/readings" className="mt-2 block text-blue-500">Meter readings</Link>
      <Link to="/bills" className="mt-2 block text-blue-500">Bills</Link>
      <Link to="/tariffs" className="mt-2 block text-blue-500">Tariffs</Link>
      <button onClick={logout} className="mt-4 rounded bg-gray-800 px-4 py-2 text-white">Logout</button>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

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
      <button onClick={logout} className="mt-4 rounded bg-gray-800 px-4 py-2 text-white">Logout</button>
    </div>
  );
}
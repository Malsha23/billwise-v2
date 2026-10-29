import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const LINKS = [
  ['/', 'Dashboard', '🏠'],
  ['/utilities', 'Utilities', '⚡'],
  ['/readings', 'Readings', '🔢'],
  ['/bills', 'Bills', '🧾'],
  ['/analytics', 'Analytics', '📈'],
  ['/tariffs', 'Tariffs', '💲'],
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
    isActive ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-slate-700'
  }`;

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const logout = async () => {
    await api.post('/auth/logout');
    navigate('/login');
  };

  if (!user) return <p className="p-6">Loading…</p>;

  const links = user.role === 'admin' ? [...LINKS, ['/admin', 'Admin', '👥']] : LINKS;

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <header className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white md:hidden">
        <span className="text-lg font-bold">Billwise</span>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          className="rounded border border-slate-600 px-2 py-1"
        >
          ☰
        </button>
      </header>

      <aside
        className={`${open ? 'block' : 'hidden'} w-full shrink-0 bg-slate-900 p-4 text-white md:sticky md:top-0 md:flex md:h-screen md:w-56 md:flex-col`}
      >
        <div className="mb-6 hidden text-xl font-bold md:block">Billwise</div>

        <nav className="flex flex-col gap-1">
          {links.map(([to, label, icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={linkClass}>
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 border-t border-slate-700 pt-4 md:mt-auto">
          <p className="truncate text-sm text-slate-300">{user.name}</p>
          <button onClick={logout} className="mt-2 w-full rounded bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">
            Logout
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
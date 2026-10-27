import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const LINKS = [
  ['/', 'Dashboard'],
  ['/utilities', 'Utilities'],
  ['/readings', 'Meter readings'],
  ['/bills', 'Bills'],
  ['/analytics', 'Analytics'],
  ['/tariffs', 'Tariffs'],
];

const linkClass = ({ isActive }) =>
  isActive ? 'font-semibold text-blue-600' : 'text-gray-600 hover:text-blue-500';

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

  const links = user.role === 'admin' ? [...LINKS, ['/admin', 'Admin']] : LINKS;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-lg font-bold text-blue-600">Billwise</span>

          <nav className="hidden gap-5 text-sm md:flex">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 sm:inline">{user.name}</span>
            <button onClick={logout} className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white">
              Logout
            </button>
            <button
              onClick={() => setOpen(!open)}
              aria-label="Menu"
              className="rounded border px-2 py-1 md:hidden"
            >
              ☰
            </button>
          </div>
        </div>

        {open && (
          <nav className="flex flex-col gap-3 border-t px-4 py-3 text-sm md:hidden">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={linkClass}>
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <Outlet />
    </div>
  );
}
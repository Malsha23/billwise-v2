import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Utilities from './pages/Utilities';
import Readings from './pages/Readings';
import Bills from './pages/Bills';
import Analytics from './pages/Analytics';
import Tariffs from './pages/Tariffs';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/utilities" element={<Utilities />} />
        <Route path="/readings" element={<Readings />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/tariffs" element={<Tariffs />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}
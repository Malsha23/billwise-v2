import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Utilities from './pages/Utilities';
import Readings from './pages/Readings';
import Bills from './pages/Bills';
import Tariffs from './pages/Tariffs';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/utilities" element={<Utilities />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/readings" element={<Readings />} />
      <Route path="/bills" element={<Bills />} />
      <Route path="/tariffs" element={<Tariffs />} />
    </Routes>
  );
}
import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Utilities from './pages/Utilities';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/utilities" element={<Utilities />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}
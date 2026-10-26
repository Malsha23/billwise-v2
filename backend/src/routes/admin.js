import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Utility from '../models/Utility.js';
import Reading from '../models/Reading.js';
import Bill from '../models/Bill.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect, adminOnly);

const ROLES = ['user', 'admin'];

const badId = (req, res) => {
  if (mongoose.isValidObjectId(req.params.id)) return false;
  res.status(400).json({ message: 'Invalid id' });
  return true;
};

// READ: search by name or email, filter by role
router.get('/users', async (req, res) => {
  const { search, role } = req.query;
  const filter = {};
  if (ROLES.includes(role)) filter.role = role;
  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  res.json({ users: await User.find(filter).sort('-createdAt') });
});

// CREATE
router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (role && !ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ message: 'Email is already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name.trim(), email, passwordHash, role: role || 'user' });
  res.status(201).json({ user });
});

// UPDATE: name and role
router.put('/users/:id', async (req, res) => {
  if (badId(req, res)) return;
  const { name, role } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
  if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });
  if (req.params.id === String(req.user._id) && role !== 'admin') {
    return res.status(400).json({ message: 'You cannot remove your own admin role' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { name: name.trim(), role }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

// DELETE: user and all of their data
router.delete('/users/:id', async (req, res) => {
  if (badId(req, res)) return;
  if (req.params.id === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await Promise.all([
    Utility.deleteMany({ user: user._id }),
    Reading.deleteMany({ user: user._id }),
    Bill.deleteMany({ user: user._id }),
  ]);
  res.json({ ok: true });
});

export default router;
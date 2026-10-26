import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { isEmail, isText } from '../utils/validate.js';

const router = Router();

const sendToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!isText(name, 2, 60)) {
    return res.status(400).json({ message: 'Name must be 2 to 60 characters' });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ message: 'Enter a valid email address' });
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 72) {
    return res.status(400).json({ message: 'Password must be 6 to 72 characters' });
  }

  const exists = await User.findOne({ email: email.trim().toLowerCase() });
  if (exists) return res.status(409).json({ message: 'Email is already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name.trim(), email: email.trim(), passwordHash });

  sendToken(res, user._id);
  res.status(201).json({ user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!isEmail(email) || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ message: 'Incorrect email or password' });

  sendToken(res, user._id);
  res.json({ user });
});



router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
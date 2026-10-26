import { Router } from 'express';
import mongoose from 'mongoose';
import Bill from '../models/Bill.js';
import { protect } from '../middleware/auth.js';
import { generateBills } from '../services/billing.js';

const router = Router();
router.use(protect);

const TYPES = ['electricity', 'water', 'gas'];
const SORTS = ['-period', 'period', '-amount', 'amount'];

const badId = (req, res) => {
  if (mongoose.isValidObjectId(req.params.id)) return false;
  res.status(400).json({ message: 'Invalid id' });
  return true;
};

// READ: filter by type, status, year, with sort
router.get('/', async (req, res) => {
  const { type, status, year, sort } = req.query;
  const filter = { user: req.user._id };
  if (TYPES.includes(type)) filter.type = type;
  if (['paid', 'pending'].includes(status)) filter.status = status;
  if (/^\d{4}$/.test(year || '')) filter.period = new RegExp(`^${year}-`);

  const bills = await Bill.find(filter)
    .populate('utility', 'provider')
    .sort(SORTS.includes(sort) ? sort : '-period');
  res.json({ bills });
});

// CREATE: generate bills for a month
router.post('/generate', async (req, res) => {
  const { period, type } = req.body;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period || '')) {
    return res.status(400).json({ message: 'Choose a valid month' });
  }
  if (type && !TYPES.includes(type)) return res.status(400).json({ message: 'Invalid utility type' });

  const bills = await generateBills(req.user._id, period, type || undefined);
  if (bills.length === 0) {
    return res.status(400).json({ message: 'No meter readings found for that month' });
  }
  res.status(201).json({ bills });
});

// UPDATE: mark as paid
router.patch('/:id/pay', async (req, res) => {
  if (badId(req, res)) return;
  const bill = await Bill.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { status: 'paid' },
    { new: true }
  );
  if (!bill) return res.status(404).json({ message: 'Bill not found' });
  res.json({ bill });
});

// DELETE
router.delete('/:id', async (req, res) => {
  if (badId(req, res)) return;
  const bill = await Bill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!bill) return res.status(404).json({ message: 'Bill not found' });
  res.json({ ok: true });
});

export default router;
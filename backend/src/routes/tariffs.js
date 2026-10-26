import { Router } from 'express';
import mongoose from 'mongoose';
import Tariff from '../models/Tariff.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const TYPES = ['electricity', 'water', 'gas'];

const check = (b) => {
  if (!TYPES.includes(b.utilityType)) return 'Choose electricity, water or gas';
  if (!b.unit?.trim()) return 'Unit is required';
  const rate = Number(b.ratePerUnit);
  if (b.ratePerUnit === '' || !Number.isFinite(rate) || rate < 0) return 'Rate must be 0 or more';
  const fixed = Number(b.fixedCharge ?? 0);
  if (!Number.isFinite(fixed) || fixed < 0) return 'Fixed charge must be 0 or more';
  if (!b.effectiveFrom || isNaN(new Date(b.effectiveFrom))) return 'Effective date is required';
  return null;
};

const fields = (b) => ({
  utilityType: b.utilityType,
  unit: b.unit.trim(),
  ratePerUnit: Number(b.ratePerUnit),
  fixedCharge: Number(b.fixedCharge || 0),
  effectiveFrom: b.effectiveFrom,
});

// READ (login required, but not admin only)
router.get('/', async (req, res) => {
  res.json({ tariffs: await Tariff.find().sort({ utilityType: 1, effectiveFrom: -1 }) });
});

// CREATE, UPDATE, DELETE (admin only)
router.post('/', adminOnly, async (req, res) => {
  const problem = check(req.body);
  if (problem) return res.status(400).json({ message: problem });
  res.status(201).json({ tariff: await Tariff.create(fields(req.body)) });
});

router.put('/:id', adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const problem = check(req.body);
  if (problem) return res.status(400).json({ message: problem });
  const tariff = await Tariff.findByIdAndUpdate(req.params.id, fields(req.body), { new: true });
  if (!tariff) return res.status(404).json({ message: 'Tariff not found' });
  res.json({ tariff });
});

router.delete('/:id', adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const tariff = await Tariff.findByIdAndDelete(req.params.id);
  if (!tariff) return res.status(404).json({ message: 'Tariff not found' });
  res.json({ ok: true });
});

export default router;
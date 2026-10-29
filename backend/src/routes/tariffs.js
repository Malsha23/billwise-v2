import { Router } from 'express';
import mongoose from 'mongoose';
import Tariff from '../models/Tariff.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const TYPES = ['electricity', 'water', 'gas'];

const checkBlocks = (blocks) => {
  let expected = 1;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const rate = Number(b.rate);
    if (!Number.isFinite(rate) || rate < 0) return 'Each block needs a rate of 0 or more';
    if (Number(b.from) !== expected) return 'Blocks must start at 1 and have no gaps';
    if (b.to === null || b.to === undefined || b.to === '') {
      if (i !== blocks.length - 1) return 'Only the last block can be open-ended';
      return null;
    }
    const to = Number(b.to);
    if (!Number.isFinite(to) || to < expected) return 'A block must end at or after its start';
    expected = to + 1;
  }
  return null;
};

const check = (b) => {
  if (!TYPES.includes(b.utilityType)) return 'Choose electricity, water or gas';
  if (!b.unit?.trim()) return 'Unit is required';

  const hasBlocks = Array.isArray(b.blocks) && b.blocks.length > 0;
  if (hasBlocks) {
    const problem = checkBlocks(b.blocks);
    if (problem) return problem;
  } else {
    const rate = Number(b.ratePerUnit);
    if (b.ratePerUnit === '' || !Number.isFinite(rate) || rate < 0) return 'Rate must be 0 or more';
  }

  const fixed = Number(b.fixedCharge ?? 0);
  if (!Number.isFinite(fixed) || fixed < 0) return 'Fixed charge must be 0 or more';
  if (!b.effectiveFrom || isNaN(new Date(b.effectiveFrom))) return 'Effective date is required';
  return null;
};

const fields = (b) => ({
  utilityType: b.utilityType,
  unit: b.unit.trim(),
  ratePerUnit: Number(b.ratePerUnit || 0),
  blocks: Array.isArray(b.blocks)
    ? b.blocks.map((x) => ({
        from: Number(x.from),
        to: x.to === null || x.to === undefined || x.to === '' ? null : Number(x.to),
        rate: Number(x.rate),
      }))
    : [],
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
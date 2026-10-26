import { Router } from 'express';
import mongoose from 'mongoose';
import Reading from '../models/Reading.js';
import Utility from '../models/Utility.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const SORTS = ['date', '-date', 'reading', '-reading'];

const check = (b) => {
  if (b.date === undefined || b.date === '' || isNaN(new Date(b.date))) return 'A valid date is required';
  const n = Number(b.reading);
  if (b.reading === '' || b.reading == null || !Number.isFinite(n) || n < 0) {
    return 'Reading must be a number, 0 or more';
  }
  return null;
};

// usage = this reading minus the previous reading (the first reading has usage 0)
const recalcUsage = async (utilityId) => {
  const list = await Reading.find({ utility: utilityId }).sort({ date: 1 });
  let prev = null;
  for (const r of list) {
    const usage = prev === null ? 0 : Math.max(0, r.reading - prev);
    if (r.usage !== usage) {
      r.usage = usage;
      await r.save();
    }
    prev = r.reading;
  }
};

// READ
router.get('/', async (req, res) => {
  const { utility, sort } = req.query;
  const filter = { user: req.user._id };
  if (utility) {
    if (!mongoose.isValidObjectId(utility)) return res.status(400).json({ message: 'Invalid utility' });
    filter.utility = utility;
  }
  const readings = await Reading.find(filter).sort(SORTS.includes(sort) ? sort : '-date');
  res.json({ readings });
});

// CREATE
router.post('/', async (req, res) => {
  const problem = check(req.body);
  if (problem) return res.status(400).json({ message: problem });
  if (!mongoose.isValidObjectId(req.body.utility)) return res.status(400).json({ message: 'Choose a utility' });

  const utility = await Utility.findOne({ _id: req.body.utility, user: req.user._id });
  if (!utility) return res.status(404).json({ message: 'Utility not found' });

  const reading = await Reading.create({
    user: req.user._id,
    utility: utility._id,
    date: req.body.date,
    reading: Number(req.body.reading),
  });
  await recalcUsage(utility._id);
  res.status(201).json({ reading: await Reading.findById(reading._id) });
});

// UPDATE
router.put('/:id', async (req, res) => {
  const problem = check(req.body);
  if (problem) return res.status(400).json({ message: problem });

  const reading = await Reading.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { date: req.body.date, reading: Number(req.body.reading) },
    { new: true }
  );
  if (!reading) return res.status(404).json({ message: 'Reading not found' });
  await recalcUsage(reading.utility);
  res.json({ reading: await Reading.findById(reading._id) });
});

// DELETE
router.delete('/:id', async (req, res) => {
  const reading = await Reading.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!reading) return res.status(404).json({ message: 'Reading not found' });
  await recalcUsage(reading.utility);
  res.json({ ok: true });
});

export default router;
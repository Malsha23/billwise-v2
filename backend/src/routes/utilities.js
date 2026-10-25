import { Router } from 'express';
import Utility from '../models/Utility.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const TYPES = ['electricity', 'water', 'gas'];
const SORTS = ['createdAt', '-createdAt', 'provider', '-provider', 'type'];

const validate = (body) => {
  if (!TYPES.includes(body.type)) return 'Type must be electricity, water or gas';
  if (!body.provider?.trim()) return 'Provider is required';
  if (!body.accountNumber?.trim()) return 'Account number is required';
  return null;
};

// READ: list, search, filter, sort
router.get('/', async (req, res) => {
  const { search, type, sort } = req.query;
  const filter = { user: req.user._id };

  if (TYPES.includes(type)) filter.type = type;
  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');
    filter.$or = [{ provider: rx }, { accountNumber: rx }];
  }

  const utilities = await Utility.find(filter).sort(SORTS.includes(sort) ? sort : '-createdAt');
  res.json({ utilities });
});

// CREATE
router.post('/', async (req, res) => {
  const problem = validate(req.body);
  if (problem) return res.status(400).json({ message: problem });

  const { type, provider, accountNumber, meterNumber } = req.body;
  const utility = await Utility.create({ user: req.user._id, type, provider, accountNumber, meterNumber });
  res.status(201).json({ utility });
});

// UPDATE
router.put('/:id', async (req, res) => {
  const problem = validate(req.body);
  if (problem) return res.status(400).json({ message: problem });

  const { type, provider, accountNumber, meterNumber } = req.body;
  const utility = await Utility.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { type, provider, accountNumber, meterNumber },
    { new: true, runValidators: true }
  );
  if (!utility) return res.status(404).json({ message: 'Utility not found' });
  res.json({ utility });
});

// DELETE
router.delete('/:id', async (req, res) => {
  const utility = await Utility.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!utility) return res.status(404).json({ message: 'Utility not found' });
  res.json({ ok: true });
});

export default router;
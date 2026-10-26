import { Router } from 'express';
import Bill from '../models/Bill.js';
import Reading from '../models/Reading.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const TYPES = ['electricity', 'water', 'gas'];
const round2 = (n) => Math.round(n * 100) / 100;
const monthsParam = (req, def = 6) => Math.min(24, Math.max(1, Number(req.query.months) || def));

// Returns an array of the last n months in YYYY-MM fromat, e.g. ['2023-07', '2023-08', '2023-09']
const lastMonths = (n) => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
};

// [{ _id: { month, type }, value }] -> [{ month, electricity, water, gas }]
const pivot = (months, rows) =>
  months.map((month) => {
    const row = { month, electricity: 0, water: 0, gas: 0 };
    rows.filter((r) => r._id.month === month).forEach((r) => {
      row[r._id.type] = round2(r.value);
    });
    return row;
  });

const usageRows = (userId, from) =>
  Reading.aggregate([
    { $match: { user: userId, date: { $gte: from } } },
    { $lookup: { from: 'utilities', localField: 'utility', foreignField: '_id', as: 'u' } },
    { $unwind: '$u' },
    {
      $group: {
        _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } }, type: '$u.type' },
        value: { $sum: '$usage' },
      },
    },
  ]);

const costRows = (userId, months) =>
  Bill.aggregate([
    { $match: { user: userId, period: { $in: months } } },
    { $group: { _id: { month: '$period', type: '$type' }, value: { $sum: '$amount' } } },
  ]);

router.get('/summary', async (req, res) => {
  const userId = req.user._id;

  const cards = await Promise.all(
    TYPES.map(async (type) => {
      const [latest, prev] = await Bill.find({ user: userId, type }).sort({ period: -1 }).limit(2);
      const change = latest && prev && prev.amount
        ? Math.round(((latest.amount - prev.amount) / prev.amount) * 100)
        : 0;
      return { type, amount: latest?.amount || 0, period: latest?.period || null, change };
    })
  );

  const months = lastMonths(12);
  const [recentBills, usageData] = await Promise.all([
    Bill.find({ user: userId }).sort({ period: -1, createdAt: -1 }).limit(5),
    usageRows(userId, new Date(`${months[0]}-01T00:00:00Z`)),
  ]);

  res.json({
    cards,
    total: round2(cards.reduce((sum, c) => sum + c.amount, 0)),
    recentBills,
    usage: pivot(months, usageData),
  });
});

router.get('/cost', async (req, res) => {
  const months = lastMonths(monthsParam(req));
  res.json({ data: pivot(months, await costRows(req.user._id, months)) });
});

router.get('/breakdown', async (req, res) => {
  const months = lastMonths(monthsParam(req));
  const data = pivot(months, await costRows(req.user._id, months));
  const totals = TYPES.map((type) => ({
    type,
    amount: round2(data.reduce((sum, m) => sum + m[type], 0)),
  }));
  const total = round2(totals.reduce((sum, t) => sum + t.amount, 0));
  res.json({
    total,
    breakdown: totals.map((t) => ({ ...t, percent: total ? Math.round((t.amount / total) * 100) : 0 })),
  });
});

export default router;
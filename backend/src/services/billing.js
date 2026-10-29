import Utility from '../models/Utility.js';
import Reading from '../models/Reading.js';
import Tariff from '../models/Tariff.js';
import Bill from '../models/Bill.js';

const DEFAULTS = {
  electricity: { ratePerUnit: 30, fixedCharge: 400 },
  water: { ratePerUnit: 60, fixedCharge: 200 },
  gas: { ratePerUnit: 120, fixedCharge: 300 },
};

const monthStart = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
};
const nextMonthStart = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 1));
};
const round2 = (n) => Math.round(n * 100) / 100;

// Charges usage block by block. Without blocks it falls back to a single rate.
const energyCharge = (usage, tariff, fallback) => {
  const blocks = [...(tariff?.blocks || [])].sort((a, b) => a.from - b.from);
  if (blocks.length === 0) return usage * (tariff?.ratePerUnit ?? fallback.ratePerUnit);

  let total = 0;
  for (const b of blocks) {
    const upper = b.to ?? Infinity;
    const units = Math.min(usage, upper) - (b.from - 1);
    if (units > 0) total += units * b.rate;
  }
  const last = blocks[blocks.length - 1];
  if (last.to !== null && usage > last.to) total += (usage - last.to) * last.rate;
  return total;
};

export async function generateBills(userId, period, type) {
  const utilities = await Utility.find({ user: userId, ...(type ? { type } : {}) });
  const start = monthStart(period);
  const end = nextMonthStart(period);
  const bills = [];

  for (const u of utilities) {
    const readings = await Reading.find({ utility: u._id, date: { $gte: start, $lt: end } });
    if (readings.length === 0) continue;

    const usage = readings.reduce((sum, r) => sum + r.usage, 0);

    const tariff = await Tariff.findOne({ utilityType: u.type, effectiveFrom: { $lte: end } }).sort({ effectiveFrom: -1 });
    const fallback = DEFAULTS[u.type];
    const fixedCharge = tariff ? tariff.fixedCharge : fallback.fixedCharge;
    const amount = round2(energyCharge(usage, tariff, fallback) + fixedCharge);

    const bill = await Bill.findOneAndUpdate(
      { utility: u._id, period },
      { $set: { user: userId, type: u.type, usage, amount }, $setOnInsert: { status: 'pending' } },
      { upsert: true, new: true }
    );
    bills.push(bill);
  }
  return bills;
}
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
    const { ratePerUnit, fixedCharge } = tariff || DEFAULTS[u.type];
    const amount = round2(usage * ratePerUnit + fixedCharge);

    const bill = await Bill.findOneAndUpdate(
      { utility: u._id, period },
      { $set: { user: userId, type: u.type, usage, amount }, $setOnInsert: { status: 'pending' } },
      { upsert: true, new: true }
    );
    bills.push(bill);
  }
  return bills;
}
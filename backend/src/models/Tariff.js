import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema(
  {
    from: { type: Number, required: true, min: 1 },
    to: { type: Number, default: null }, // null = no upper limit
    rate: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const tariffSchema = new mongoose.Schema(
  {
    utilityType: { type: String, enum: ['electricity', 'water', 'gas'], required: true },
    unit: { type: String, required: true, trim: true },
    ratePerUnit: { type: Number, default: 0, min: 0 }, // used when there are no blocks
    blocks: { type: [blockSchema], default: [] },
    fixedCharge: { type: Number, default: 0, min: 0 },
    effectiveFrom: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Tariff', tariffSchema);
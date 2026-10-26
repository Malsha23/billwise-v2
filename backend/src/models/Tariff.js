import mongoose from 'mongoose';

const tariffSchema = new mongoose.Schema(
  {
    utilityType: { type: String, enum: ['electricity', 'water', 'gas'], required: true },
    unit: { type: String, required: true, trim: true },
    ratePerUnit: { type: Number, required: true, min: 0 },
    fixedCharge: { type: Number, default: 0, min: 0 },
    effectiveFrom: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Tariff', tariffSchema);
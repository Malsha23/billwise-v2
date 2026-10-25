import mongoose from 'mongoose';

const utilitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['electricity', 'water', 'gas'], required: true },
    provider: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    meterNumber: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Utility', utilitySchema);
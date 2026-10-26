import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    utility: { type: mongoose.Schema.Types.ObjectId, ref: 'Utility', required: true },
    type: { type: String, enum: ['electricity', 'water', 'gas'], required: true },
    period: { type: String, required: true }, // YYYY-MM
    usage: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
  },
  { timestamps: true }
);

// එකම utility එකට එකම මාසයට bill එකක් විතරයි
billSchema.index({ utility: 1, period: 1 }, { unique: true });

export default mongoose.model('Bill', billSchema);
import mongoose from 'mongoose';

const readingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    utility: { type: mongoose.Schema.Types.ObjectId, ref: 'Utility', required: true, index: true },
    date: { type: Date, required: true },
    reading: { type: Number, required: true, min: 0 },
    usage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Reading', readingSchema);
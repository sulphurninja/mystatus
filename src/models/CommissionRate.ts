import mongoose, { Document, Schema } from 'mongoose';

export interface ICommissionRate extends Document {
  level: number; // 1-6
  referralBonus: number; // Percentage for direct referral
  levelBonus: number; // Percentage for level commissions
  keyPurchaseBonus: number; // Bonus when someone purchases a key through referral
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionRateSchema: Schema = new Schema({
  level: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 6
  },
  referralBonus: {
    type: Number,
    required: true,
    default: 0
  },
  levelBonus: {
    type: Number,
    required: true,
    default: 0
  },
  keyPurchaseBonus: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.CommissionRate || mongoose.model<ICommissionRate>('CommissionRate', CommissionRateSchema);

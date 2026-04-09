import mongoose, { Document, Schema } from 'mongoose';

export interface IFranchisePayoutPlan extends Document {
  franchiseKey: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  tier: mongoose.Types.ObjectId;
  dailyCommissions: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
    level6: number;
    level7: number;
    level8: number;
    level9: number;
    level10: number;
    level11: number;
    level12: number;
    level13: number;
    level14: number;
    level15: number;
    level16: number;
    level17: number;
    level18: number;
    level19: number;
    level20: number;
    level21: number;
    level22: number;
    level23: number;
    level24: number;
    level25: number;
    level26: number;
    level27: number;
    level28: number;
    level29: number;
    level30: number;
  };
  maxLevels: number;
  startDate: Date;
  endDate?: Date;
  lastPaidAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FranchisePayoutPlanSchema: Schema = new Schema({
  franchiseKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FranchiseKey',
    required: true,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FranchiseKeyTier',
    required: true
  },
  dailyCommissions: {
    level1: { type: Number, default: 0, min: 0 },
    level2: { type: Number, default: 0, min: 0 },
    level3: { type: Number, default: 0, min: 0 },
    level4: { type: Number, default: 0, min: 0 },
    level5: { type: Number, default: 0, min: 0 },
    level6: { type: Number, default: 0, min: 0 },
    level7: { type: Number, default: 0, min: 0 },
    level8: { type: Number, default: 0, min: 0 },
    level9: { type: Number, default: 0, min: 0 },
    level10: { type: Number, default: 0, min: 0 },
    level11: { type: Number, default: 0, min: 0 },
    level12: { type: Number, default: 0, min: 0 },
    level13: { type: Number, default: 0, min: 0 },
    level14: { type: Number, default: 0, min: 0 },
    level15: { type: Number, default: 0, min: 0 },
    level16: { type: Number, default: 0, min: 0 },
    level17: { type: Number, default: 0, min: 0 },
    level18: { type: Number, default: 0, min: 0 },
    level19: { type: Number, default: 0, min: 0 },
    level20: { type: Number, default: 0, min: 0 },
    level21: { type: Number, default: 0, min: 0 },
    level22: { type: Number, default: 0, min: 0 },
    level23: { type: Number, default: 0, min: 0 },
    level24: { type: Number, default: 0, min: 0 },
    level25: { type: Number, default: 0, min: 0 },
    level26: { type: Number, default: 0, min: 0 },
    level27: { type: Number, default: 0, min: 0 },
    level28: { type: Number, default: 0, min: 0 },
    level29: { type: Number, default: 0, min: 0 },
    level30: { type: Number, default: 0, min: 0 }
  },
  maxLevels: {
    type: Number,
    default: 30,
    min: 1,
    max: 30
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  lastPaidAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

FranchisePayoutPlanSchema.index({ owner: 1, isActive: 1 });
FranchisePayoutPlanSchema.index({ isActive: 1, startDate: 1 });

export default mongoose.models.FranchisePayoutPlan || mongoose.model<IFranchisePayoutPlan>('FranchisePayoutPlan', FranchisePayoutPlanSchema);

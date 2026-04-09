import mongoose, { Document, Schema } from 'mongoose';

export interface IFranchiseDailyPayout extends Document {
  plan: mongoose.Types.ObjectId;
  franchiseKey: mongoose.Types.ObjectId;
  paidTo: mongoose.Types.ObjectId;
  referredUser: mongoose.Types.ObjectId;
  level: number;
  amount: number;
  payoutDate: Date;
  commission?: mongoose.Types.ObjectId;
  transaction?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FranchiseDailyPayoutSchema: Schema = new Schema({
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FranchisePayoutPlan',
    required: true,
    index: true
  },
  franchiseKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FranchiseKey',
    required: true
  },
  paidTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  payoutDate: {
    type: Date,
    required: true,
    index: true
  },
  commission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commission'
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }
}, {
  timestamps: true
});

FranchiseDailyPayoutSchema.index({ plan: 1, payoutDate: 1, paidTo: 1, level: 1 }, { unique: true });
FranchiseDailyPayoutSchema.index({ payoutDate: 1, paidTo: 1 });

export default mongoose.models.FranchiseDailyPayout || mongoose.model<IFranchiseDailyPayout>('FranchiseDailyPayout', FranchiseDailyPayoutSchema);

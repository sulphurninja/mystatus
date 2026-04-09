import mongoose, { Document, Schema } from 'mongoose';

export interface IFranchisePayoutRun extends Document {
  plan: mongoose.Types.ObjectId;
  franchiseKey: mongoose.Types.ObjectId;
  payoutDate: Date;
  status: 'processing' | 'completed' | 'failed';
  totalPaid: number;
  totalRecipients: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FranchisePayoutRunSchema: Schema = new Schema({
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
  payoutDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRecipients: {
    type: Number,
    default: 0,
    min: 0
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

FranchisePayoutRunSchema.index({ plan: 1, payoutDate: 1 }, { unique: true });
FranchisePayoutRunSchema.index({ payoutDate: 1, status: 1 });

export default mongoose.models.FranchisePayoutRun || mongoose.model<IFranchisePayoutRun>('FranchisePayoutRun', FranchisePayoutRunSchema);

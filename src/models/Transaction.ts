import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 'credit' | 'debit';
export type TransactionReason = 'reward_earned' | 'advertisement_cost' | 'withdrawal' | 'bonus' | 'admin_credit' | 'commission' | 'key_purchase' | 'referral_bonus';

export interface ITransaction extends Document {
  user?: mongoose.Types.ObjectId;
  vendor?: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  reason: TransactionReason;
  description: string;
  reference?: mongoose.Types.ObjectId;
  referenceModel?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    enum: ['reward_earned', 'advertisement_cost', 'withdrawal', 'bonus', 'admin_credit', 'commission', 'key_purchase', 'referral_bonus'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId
  },
  referenceModel: {
    type: String,
    enum: ['Share', 'Advertisement', 'User', 'Vendor']
  },
  balanceBefore: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Validation is now handled in API routes

// Indexes for efficient queries
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ vendor: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, reason: 1 });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

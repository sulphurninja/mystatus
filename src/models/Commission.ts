import mongoose, { Document, Schema } from 'mongoose';

export type CommissionType =
  | 'referral'
  | 'level_bonus'
  | 'key_purchase'
  | 'key_activation'
  | 'key_renewal'
  | 'franchise_daily';

export interface ICommission extends Document {
  user: mongoose.Types.ObjectId;
  referredUser?: mongoose.Types.ObjectId;
  commissionType: CommissionType;
  level: number; // 1-30 for MLM levels
  amount: number;
  description: string;
  payoutStatus: 'pending' | 'paid';
  isPaid: boolean;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  commissionType: {
    type: String,
    enum: ['referral', 'level_bonus', 'key_purchase', 'key_activation', 'key_renewal', 'franchise_daily'],
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
  description: {
    type: String,
    required: true
  },
  payoutStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'paid',
    index: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
CommissionSchema.index({ user: 1, createdAt: -1 });
CommissionSchema.index({ referredUser: 1 });
CommissionSchema.index({ commissionType: 1, level: 1 });
CommissionSchema.index({ user: 1, payoutStatus: 1, level: 1 });

export default mongoose.models.Commission || mongoose.model<ICommission>('Commission', CommissionSchema);

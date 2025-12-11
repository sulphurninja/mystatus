import mongoose, { Document, Schema } from 'mongoose';

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface IWithdrawalRequest extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  activationKey: string; // Key used for this withdrawal
  status: WithdrawalStatus;
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId; // Admin who processed
  rejectionReason?: string;
  paymentDetails?: {
    upiId?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1, 'Withdrawal amount must be at least 1']
  },
  activationKey: {
    type: String,
    required: [true, 'Activation key is required for withdrawal'],
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  paymentDetails: {
    upiId: String,
    bankAccount: String,
    ifscCode: String,
    accountHolderName: String
  }
}, {
  timestamps: true
});

// Indexes
WithdrawalRequestSchema.index({ user: 1, createdAt: -1 });
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.WithdrawalRequest || mongoose.model<IWithdrawalRequest>('WithdrawalRequest', WithdrawalRequestSchema);


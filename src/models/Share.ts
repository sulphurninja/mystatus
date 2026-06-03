import mongoose, { Document, Schema } from 'mongoose';

export type ShareStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface IShare extends Document {
  user: mongoose.Types.ObjectId;
  advertisement: mongoose.Types.ObjectId;
  sharedAt: Date;
  verificationDeadline: Date;
  status: ShareStatus;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  proofImage?: string;
  rewardAmount: number;
  isRewardCredited: boolean;
  creditedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShareSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  advertisement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true
  },
  sharedAt: {
    type: Date,
    default: Date.now
  },
  verificationDeadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    maxlength: [200, 'Rejection reason cannot be more than 200 characters']
  },
  proofImage: {
    type: String
  },
  rewardAmount: {
    type: Number,
    required: true,
    min: 0
  },
  isRewardCredited: {
    type: Boolean,
    default: false
  },
  creditedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
ShareSchema.index({ user: 1, advertisement: 1 });
ShareSchema.index({ status: 1, verificationDeadline: 1 });

export default mongoose.models.Share || mongoose.model<IShare>('Share', ShareSchema);

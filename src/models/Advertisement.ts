import mongoose, { Document, Schema } from 'mongoose';

export interface IAdvertisement extends Document {
  title: string;
  description: string;
  image: string;
  rewardAmount: number;
  vendor: mongoose.Types.ObjectId;
  isActive: boolean;
  totalShares: number;
  totalVerifiedShares: number;
  totalRewardsPaid: number;
  verificationPeriodHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Image is required']
  },
  rewardAmount: {
    type: Number,
    required: [true, 'Reward amount is required'],
    min: [0, 'Reward amount cannot be negative']
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalShares: {
    type: Number,
    default: 0
  },
  totalVerifiedShares: {
    type: Number,
    default: 0
  },
  totalRewardsPaid: {
    type: Number,
    default: 0
  },
  verificationPeriodHours: {
    type: Number,
    default: 8,
    min: 1,
    max: 24
  }
}, {
  timestamps: true
});

export default mongoose.models.Advertisement || mongoose.model<IAdvertisement>('Advertisement', AdvertisementSchema);

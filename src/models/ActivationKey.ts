import mongoose, { Document, Schema } from 'mongoose';

export interface IActivationKey extends Document {
  key: string;
  isUsed: boolean;
  usedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  price: number;
  isForSale: boolean;
  soldBy?: mongoose.Types.ObjectId;
  soldAt?: Date;
  purchasedBy?: mongoose.Types.ObjectId;
  purchasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivationKeySchema: Schema = new Schema({
  key: {
    type: String,
    required: [true, 'Activation key is required'],
    unique: true,
    uppercase: true,
    minlength: 6,
    maxlength: 8
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'User'
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 2000 // Default price in rupees
  },
  isForSale: {
    type: Boolean,
    default: true
  },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  soldAt: {
    type: Date
  },
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  purchasedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.models.ActivationKey || mongoose.model<IActivationKey>('ActivationKey', ActivationKeySchema);

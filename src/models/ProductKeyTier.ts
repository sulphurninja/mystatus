import mongoose, { Document, Schema } from 'mongoose';

export interface IProductKeyTier extends Document {
  name: string;
  minPrice: number;
  maxPrice: number;
  commissions: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
    level6: number;
  };
  recurringDirect: {
    amount: number;
    type: 'amount' | 'percent';
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductKeyTierSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  minPrice: {
    type: Number,
    required: true,
    min: 0
  },
  maxPrice: {
    type: Number,
    required: true,
    min: 0
  },
  commissions: {
    level1: { type: Number, default: 0, min: 0 },
    level2: { type: Number, default: 0, min: 0 },
    level3: { type: Number, default: 0, min: 0 },
    level4: { type: Number, default: 0, min: 0 },
    level5: { type: Number, default: 0, min: 0 },
    level6: { type: Number, default: 0, min: 0 }
  },
  recurringDirect: {
    amount: { type: Number, default: 0, min: 0 },
    type: { type: String, enum: ['amount', 'percent'], default: 'amount' }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.ProductKeyTier || mongoose.model<IProductKeyTier>('ProductKeyTier', ProductKeyTierSchema);

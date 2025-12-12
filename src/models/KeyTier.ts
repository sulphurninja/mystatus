import mongoose, { Document, Schema } from 'mongoose';

export interface IKeyTier extends Document {
  name: string; // e.g., "Standard", "Premium", "VIP"
  minPrice: number; // Minimum key price for this tier
  maxPrice: number; // Maximum key price for this tier
  commissions: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
    level6: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KeyTierSchema: Schema = new Schema({
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Static method to get tier by key price
KeyTierSchema.statics.getTierByPrice = async function(price: number) {
  return this.findOne({
    minPrice: { $lte: price },
    maxPrice: { $gte: price },
    isActive: true
  });
};

export default mongoose.models.KeyTier || mongoose.model<IKeyTier>('KeyTier', KeyTierSchema);


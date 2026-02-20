import mongoose, { Document, Schema } from 'mongoose';

export interface IPackage extends Document {
  name: string;
  description: string;
  price: number;
  adLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  adLimit: {
    type: Number,
    required: [true, 'Ad limit is required'],
    min: [1, 'Ad limit must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IVendorPackage extends Document {
  vendor: mongoose.Types.ObjectId;
  package: mongoose.Types.ObjectId;
  adsAllotted: number;
  adsUsed: number;
  price: number;
  assignedBy: string;
  status: 'active' | 'expired' | 'exhausted';
  createdAt: Date;
  updatedAt: Date;
}

const VendorPackageSchema: Schema = new Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  adsAllotted: {
    type: Number,
    required: true,
    min: 1
  },
  adsUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  assignedBy: {
    type: String,
    default: 'admin'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'exhausted'],
    default: 'active'
  }
}, {
  timestamps: true
});

VendorPackageSchema.index({ vendor: 1, status: 1 });
VendorPackageSchema.index({ vendor: 1, createdAt: -1 });

export default mongoose.models.VendorPackage || mongoose.model<IVendorPackage>('VendorPackage', VendorPackageSchema);

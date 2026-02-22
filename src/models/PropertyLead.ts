import mongoose, { Document, Schema } from 'mongoose';

export interface IPropertyLead extends Document {
  name: string;
  contactNumber: string;
  email: string;
  address: string;
  requiresLoan: boolean;
  property: mongoose.Types.ObjectId;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyLeadSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    maxlength: [20, 'Contact number cannot be more than 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    maxlength: [100, 'Email cannot be more than 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [300, 'Address cannot be more than 300 characters']
  },
  requiresLoan: {
    type: Boolean,
    default: false
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true
  },
  referralCode: {
    type: String,
    trim: true,
    maxlength: [50, 'Referral code cannot be more than 50 characters']
  }
}, {
  timestamps: true
});

PropertyLeadSchema.index({ property: 1, referralCode: 1, createdAt: -1 });

export default mongoose.models.PropertyLead || mongoose.model<IPropertyLead>('PropertyLead', PropertyLeadSchema);

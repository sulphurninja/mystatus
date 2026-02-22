import mongoose, { Document, Schema } from 'mongoose';

export interface ILoanApplication extends Document {
  name: string;
  contactNumber: string;
  email: string;
  pan: string;
  aadhaar: string;
  property: mongoose.Types.ObjectId;
  referralCode?: string;
  panCardUrl: string;
  aadhaarCardUrl: string;
  bankStatementUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoanApplicationSchema: Schema = new Schema({
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
  pan: {
    type: String,
    required: [true, 'PAN is required'],
    trim: true,
    maxlength: [20, 'PAN cannot be more than 20 characters']
  },
  aadhaar: {
    type: String,
    required: [true, 'Aadhaar is required'],
    trim: true,
    maxlength: [20, 'Aadhaar cannot be more than 20 characters']
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
  },
  panCardUrl: {
    type: String,
    required: [true, 'PAN card upload is required']
  },
  aadhaarCardUrl: {
    type: String,
    required: [true, 'Aadhaar card upload is required']
  },
  bankStatementUrl: {
    type: String,
    required: [true, 'Bank statement upload is required']
  }
}, {
  timestamps: true
});

LoanApplicationSchema.index({ property: 1, referralCode: 1, createdAt: -1 });

export default mongoose.models.LoanApplication || mongoose.model<ILoanApplication>('LoanApplication', LoanApplicationSchema);

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  activationKey?: string;
  profileImage?: string;
  walletBalance: number;
  isActive: boolean;
  canShareAds: boolean;
  // MLM Fields
  referredBy?: mongoose.Types.ObjectId;
  referralCode: string;
  referralLevel: number; // 1-6 levels
  totalReferrals: number;
  activeReferrals: number;
  totalCommissionEarned: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    unique: true,
    sparse: true
  },
  activationKey: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    index: true
  },
  profileImage: {
    type: String
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  canShareAds: {
    type: Boolean,
    default: false
  },
  // MLM Fields
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referralLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 6
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  activeReferrals: {
    type: Number,
    default: 0
  },
  totalCommissionEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving (if we add password field later)
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) {
//     next();
//   }

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// Check if user can share vendor ads (completed 8-day challenge or manually activated)
UserSchema.methods.canShareVendorAds = function(): boolean {
  // If manually activated by admin, allow immediately
  if (this.canShareAds) {
    return true;
  }

  // Must complete 8 days of sharing MyStatus ads
  return this.onboardingDaysCompleted >= 8;
};

// Get days remaining until user can share vendor ads
UserSchema.methods.getDaysUntilCanShare = function(): number {
  return Math.max(0, 8 - (this.onboardingDaysCompleted || 0));
};

// Check if user can progress to next onboarding day (hasn't shared today yet)
UserSchema.methods.canProgressOnboarding = function(): boolean {
  if (this.onboardingDaysCompleted >= 8) {
    return false; // Already completed
  }
  
  if (!this.lastOnboardingShareDate) {
    return true; // Never shared, can progress
  }
  
  // Check if last share was before today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastShare = new Date(this.lastOnboardingShareDate);
  lastShare.setHours(0, 0, 0, 0);
  
  return lastShare < today; // Can progress if last share was before today
};

// Check if user has shared today (for UI display)
UserSchema.methods.hasSharedToday = function(): boolean {
  if (!this.lastOnboardingShareDate) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastShare = new Date(this.lastOnboardingShareDate);
  lastShare.setHours(0, 0, 0, 0);
  
  return lastShare.getTime() === today.getTime();
};

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // For now, since we don't have passwords, this is a placeholder
  return false;
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

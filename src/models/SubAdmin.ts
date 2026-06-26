import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ADMIN_PERMISSIONS, AdminPermission } from '@/lib/adminPermissions';

export interface ISubAdmin extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  profileImage?: string;
  permissions: AdminPermission[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const SubAdminSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [80, 'Name cannot be more than 80 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    enum: ADMIN_PERMISSIONS,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

SubAdminSchema.pre('save', async function(this: ISubAdmin) {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

SubAdminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.SubAdmin || mongoose.model<ISubAdmin>('SubAdmin', SubAdminSchema);

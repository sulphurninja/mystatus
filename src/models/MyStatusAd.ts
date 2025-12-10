import mongoose, { Document, Schema } from 'mongoose';

export interface IMyStatusAd extends Document {
  title: string;
  description: string;
  image: string;
  category: string; // motivation, inspiration, success, etc.
  isActive: boolean;
  totalShares: number;
  createdAt: Date;
  updatedAt: Date;
}

const MyStatusAdSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Image is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['motivation', 'inspiration', 'success', 'mindset', 'goals', 'positivity'],
    default: 'motivation'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalShares: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.models.MyStatusAd || mongoose.model<IMyStatusAd>('MyStatusAd', MyStatusAdSchema);

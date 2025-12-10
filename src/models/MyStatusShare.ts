import mongoose, { Document, Schema } from 'mongoose';

export interface IMyStatusShare extends Document {
  user: mongoose.Types.ObjectId;
  mystatusAd: mongoose.Types.ObjectId;
  sharedAt: Date;
  status: 'pending' | 'shared'; // MyStatus shares don't need verification, just tracking
  createdAt: Date;
  updatedAt: Date;
}

const MyStatusShareSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mystatusAd: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MyStatusAd',
    required: true
  },
  sharedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'shared'],
    default: 'shared' // MyStatus shares are immediately marked as shared
  }
}, {
  timestamps: true
});

// Index for efficient queries
MyStatusShareSchema.index({ user: 1, mystatusAd: 1 });

export default mongoose.models.MyStatusShare || mongoose.model<IMyStatusShare>('MyStatusShare', MyStatusShareSchema);

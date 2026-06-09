import mongoose, { Schema, Document } from 'mongoose';

export interface ICommentRead extends Document {
  user: mongoose.Types.ObjectId;
  card: mongoose.Types.ObjectId;
  lastReadAt: Date;
}

const commentReadSchema = new Schema<ICommentRead>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  card: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
  lastReadAt: { type: Date, required: true, default: Date.now },
});

// This ensures one record per user per card — no duplicates
commentReadSchema.index({ user: 1, card: 1 }, { unique: true });

export const CommentRead = mongoose.model<ICommentRead>('CommentRead', commentReadSchema);
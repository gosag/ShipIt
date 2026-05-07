import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  card: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  mentions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    card: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

export const Comment = mongoose.model<IComment>('Comment', commentSchema);

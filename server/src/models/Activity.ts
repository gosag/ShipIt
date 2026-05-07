import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  workspace: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  card?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: string;
  meta: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    card: { type: Schema.Types.ObjectId, ref: 'Card' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);

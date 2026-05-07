import mongoose, { Schema, Document } from 'mongoose';

export interface IColumn extends Document {
  title: string;
  project: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  order: number;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const columnSchema = new Schema<IColumn>(
  {
    title: { type: String, required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    order: { type: Number, required: true, default: 0 },
    color: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Column = mongoose.model<IColumn>('Column', columnSchema);

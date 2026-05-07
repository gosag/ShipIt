import mongoose, { Schema, Document } from 'mongoose';

export interface IInvite extends Document {
  workspace: mongoose.Types.ObjectId;
  email: string;
  token: string;
  role: 'admin' | 'member' | 'viewer';
  expiresAt: Date;
  accepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<IInvite>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'member', 'viewer'], required: true, default: 'member' },
    expiresAt: { type: Date, required: true },
    accepted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Invite = mongoose.model<IInvite>('Invite', inviteSchema);

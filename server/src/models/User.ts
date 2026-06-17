import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationPreferences {
  cardMoves: boolean;
  messages: boolean;
  joinRequests: boolean;
}

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  notificationPreferences: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;

}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    avatar: { type: String, default: null },
    notificationPreferences: {
      cardMoves: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      joinRequests: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);

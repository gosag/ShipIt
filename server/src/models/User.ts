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
  googleId?: string; // Optional field for Google OAuth users
}

const userSchema = new Schema<IUser>(
  { 
    name: { type: String, required: true },
    googleId: { type: String, unique: true, sparse: true }, 
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: function() { return !this.googleId; } },
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

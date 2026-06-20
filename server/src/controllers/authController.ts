import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';
import passport from 'passport';
// Configuration
const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '30d';
const REFRESH_TOKEN_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
interface customError extends Error{
  status?:number,
  statusCode?:number
}
const generateAccessToken = (userId: string, email: string, name: string) => {
  return jwt.sign({ _id: userId, email, name }, process.env.JWT_SECRET! , { expiresIn: ACCESS_TOKEN_EXPIRATION });
};

const generateRefreshToken = (userId: string, email: string, name: string) => {
  return jwt.sign({ _id: userId, email, name }, process.env.JWT_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRATION });
};
export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(400).json({ message: 'Google authentication failed' });
  }
  try {
    const user = req.user as any;
    const accessToken = generateAccessToken(user._id, user.email, user.name);
    const refreshToken = generateRefreshToken(user._id, user.email, user.name);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login/?accessToken=${accessToken}`);
  } catch (error) {
    next(error);
  }

};
export const register = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { name, email, password, avatar } = req.body;
    const username ="@"+ email.split('@')[0];
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, avatar, username });
    await user.save();
    if (!user) {
      const error = new Error("User registration failed") as customError;
      error.status = 500;
      throw error;
    }
    console.log("New user registered:", user);
    const accessToken = generateAccessToken(user.id, user.email, user.name);
    const refreshToken = generateRefreshToken(user.id, user.email, user.name);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    res.status(201).json({
      user: { _id: user.id, name: user.name, email: user.email, avatar: user.avatar, username: user.username },
      accessToken,
    });
  } catch (error:any) {
    console.error("Registration error:", error);
    if (error.name === 'ValidationError') {
      const errors = Object.values((error as any).errors).map((el: any) => el.message);
      const errorMessage = `Validation error: ${errors.join(', ')}`;
      console.error(errorMessage);
      return res.status(400).json({ message: errorMessage });
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Please register first' });
    }
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ message: 'The password you entered is incorrect' });
    }
    const accessToken = generateAccessToken(user.id, user.email, user.name);
    const refreshToken = generateRefreshToken(user.id, user.email, user.name);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    res.json({
      user: { _id: user.id, name: user.name, email: user.email, avatar: user.avatar, username: user.username },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

export const refresh = async (req: Request, res: Response): Promise<any> => {
  console.log("Refresh hit! Cookies received:", req.cookies);
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    console.log("No refresh token provided.");
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { _id: string; email: string; name: string };
    const accessToken = generateAccessToken(decoded._id, decoded.email, decoded.name);
    res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};
export const userInfo= asyncHandler(async(req:AuthRequest,res:Response, next:NextFunction)=>{ 
  if(!req.user ||!req.user.email){
    const error = new Error("Not authenticated, No token") as customError;
    error.status=401;
    throw error
  }
  const email= req.user.email;
  const user = await User.findOne({email}).select("-password");
  if(!user){
    const error= new Error("User info is not found") as customError;
    error.status=404;
    throw error;
  }
  res.json(user);
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    const error = new Error("Not authenticated") as customError;
    error.status = 401;
    throw error;
  }
  const { name } = req.body;
  if (!name?.trim()) {
    const error = new Error("Name is required") as customError;
    error.status = 400;
    throw error;
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: name.trim() },
    { new: true }
  ).select("-password");
  if (!user) {
    const error = new Error("User not found") as customError;
    error.status = 404;
    throw error;
  }
  res.json(user);
});

export const updateEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    const error = new Error("Not authenticated") as customError;
    error.status = 401;
    throw error;
  }
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    const error = new Error("Email and current password are required") as customError;
    error.status = 400;
    throw error;
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    const error = new Error("User not found") as customError;
    error.status = 404;
    throw error;
  }
  const isMatch = await bcrypt.compare(password, user.password!);
  if (!isMatch) {
    const error = new Error("Incorrect password") as customError;
    error.status = 400;
    throw error;
  }
  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing && existing._id.toString() !== req.user._id) {
    const error = new Error("Email already in use") as customError;
    error.status = 400;
    throw error;
  }
  user.email = email.trim().toLowerCase();
  await user.save();
  const updated = await User.findById(user._id).select("-password");
  res.json(updated);
});

export const updatePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    const error = new Error("Not authenticated") as customError;
    error.status = 401;
    throw error;
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    const error = new Error("Current and new password are required") as customError;
    error.status = 400;
    throw error;
  }
  if (newPassword.length < 6) {
    const error = new Error("New password must be at least 6 characters") as customError;
    error.status = 400;
    throw error;
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    const error = new Error("User not found") as customError;
    error.status = 404;
    throw error;
  }
  const isMatch = await bcrypt.compare(currentPassword, user.password!);
  if (!isMatch) {
    const error = new Error("Incorrect current password") as customError;
    error.status = 400;
    throw error;
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password updated successfully" });
});

export const updateAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    const error = new Error("Not authenticated") as customError;
    error.status = 401;
    throw error;
  }
  const { avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatar || null },
    { new: true }
  ).select("-password");
  if (!user) {
    const error = new Error("User not found") as customError;
    error.status = 404;
    throw error;
  }
  res.json(user);
});

export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    const error = new Error("Not authenticated") as customError;
    error.status = 401;
    throw error;
  }
  const { password } = req.body;
  if (!password) {
    const error = new Error("Password is required to delete account") as customError;
    error.status = 400;
    throw error;
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    const error = new Error("User not found") as customError;
    error.status = 404;
    throw error;
  }
  const isMatch = await bcrypt.compare(password, user.password!);
  if (!isMatch) {
    const error = new Error("Incorrect password") as customError;
    error.status = 400;
    throw error;
  }
  const { Workspace } = await import("../models/Workspace.js");
  const { Notification } = await import("../models/Notification.js");
  await Workspace.updateMany(
    { "members.user": req.user._id },
    { $pull: { members: { user: req.user._id } } }
  );
  await Workspace.deleteMany({ owner: req.user._id });
  await Notification.deleteMany({ $or: [{ sender: req.user._id }, { recipient: req.user._id }] });
  await User.findByIdAndDelete(req.user._id);
  res.clearCookie("refreshToken");
  res.json({ message: "Account deleted successfully" });
});

export const getNotificationPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    const error = new Error("Not authenticated") as customError;
    error.status = 401;
    throw error;
  }
  const user = await User.findById(req.user._id).select("notificationPreferences");
  if (!user) {
    const error = new Error("User not found") as customError;
    error.status = 404;
    throw error;
  }
  res.json(user.notificationPreferences ?? { cardMoves: true, messages: true, joinRequests: true });
});

export const updateNotificationPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    const error = new Error("Not authenticated") as customError;
    error.status = 401;
    throw error;
  }
  const { cardMoves, messages, joinRequests } = req.body;
  const update: Record<string, boolean> = {};
  if (typeof cardMoves === "boolean") update["notificationPreferences.cardMoves"] = cardMoves;
  if (typeof messages === "boolean") update["notificationPreferences.messages"] = messages;
  if (typeof joinRequests === "boolean") update["notificationPreferences.joinRequests"] = joinRequests;
  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select("notificationPreferences");
  if (!user) {
    const error = new Error("User not found") as customError;
    error.status = 404;
    throw error;
  }
  res.json(user.notificationPreferences);
});

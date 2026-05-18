import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';
// Configuration
const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '30d';
const REFRESH_TOKEN_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
interface customError extends Error{
  status?:number,
  statusCode?:number
}
const generateAccessToken = (userId: string, email: string) => {
  return jwt.sign({ _id: userId, email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: ACCESS_TOKEN_EXPIRATION });
};

const generateRefreshToken = (userId: string, email: string) => {
  return jwt.sign({ _id: userId, email }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', { expiresIn: REFRESH_TOKEN_EXPIRATION });
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    res.status(201).json({
      user: { _id: user.id, name: user.name, email: user.email },
      accessToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    res.json({
      user: { _id: user.id, name: user.name, email: user.email },
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

export const refresh = async (req: Request, res: Response): Promise<any> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret') as { _id: string; email: string };
    const accessToken = generateAccessToken(decoded._id, decoded.email);
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
  const userInfo= await User.findOne({email})
  if(!userInfo){
    const error= new Error("User info is not found") as customError;
    error.status=404;
    throw error;
  }
  console.log(userInfo);
  res.json(userInfo)
})

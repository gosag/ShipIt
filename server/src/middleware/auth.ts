import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No access token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { _id: string; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

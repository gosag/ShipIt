import type {Response, NextFunction} from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import {Comment}  from "../models/Comment.js";
import AsyncHandler from 'express-async-handler';
type customError = {
    status?: number;
}
export const getComments = AsyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if(!req.user || !req.user._id){
        const error= new Error('Unauthorized') as customError;
        error.status = 401;
        throw error;
    }
    try {

    }catch(error){
        next(error);
    }
});

export const sendComment = AsyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if(!req.user || !req.user._id){
        const error= new Error('Unauthorized') as customError;
        error.status = 401;
        throw error;
    }

    try{
        const { workspace, content, mentions} = req.body;
        const cardId= req.params.cardId;
        if(!cardId || !workspace || !content){
            const error= new Error('Missing required fields') as customError;
            error.status = 400;
            throw error;
        }
    const newComment = new Comment({
        card: cardId,
        workspace,
        author: req.user._id,
        content,
        mentions
    })
    const savedComment = await newComment.save();
    if(!savedComment){
        const error= new Error('Failed to save comment') as customError;
        error.status = 500;
        throw error;
    }
    res.status(201).json(savedComment);
    }catch(error){
        next(error);
    }
});

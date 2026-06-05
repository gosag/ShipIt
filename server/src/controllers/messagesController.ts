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
        const cardId = req.params.cardId;
        if(!cardId){
            const error= new Error('Card ID is required') as customError;
            error.status = 400;
            throw error;
        }
        const comments = await Comment.find({ card: cardId }).populate('author', 'name email avatar');
        res.json(comments);

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
    const populatedComment = await savedComment.populate('author', 'name email avatar');
    if(!populatedComment){
        const error= new Error('Failed to populate comment') as customError;
        error.status = 500;
        throw error;
    }
    res.status(201).json(populatedComment);
    }catch(error){
        next(error);
    }
});

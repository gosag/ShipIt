import type {Response, NextFunction} from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import {Comment}  from "../models/Comment.js";
import { Card } from '../models/Card.js';
import AsyncHandler from 'express-async-handler';
import { User } from '../models/index.js';
import { Notification } from '../models/Notification.js';
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
        });
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
        const card = await Card.findById(cardId);
        if(!card){
            const error= new Error('Card not found') as customError;    
            error.status = 404;
            throw error;
        }
        const cardTitle= card.title;
        const assignees = card.assignees;
        const receipentsID = assignees?.filter(assigne => assigne.toString() !== req.user?._id.toString()).map(assigne => assigne.toString()) || [];
        if(assignees && assignees.length > 0){
          await Promise.all(assignees.map(async (assigne) => {
                if(!assigne || assigne.toString() === req.user?._id.toString()){
                    return;
                }
                const user = await User.findById(assigne);
                if(user?.notificationPreferences.messages){
                    try{
                      await new Notification({
                            sender: req.user?._id,
                            senderName: req.user?.name,
                            recipient: assigne,
                            workspace,
                            type: "new_comment",
                            message: `${req.user?.name} commented (${content}) on card ${cardTitle}`,
                            link: `/workspaces/${workspace}/cards/${cardId}`,
                        }).save();
                    } catch (error) {
                        console.error('Error creating notification:', error);

                    }
                 }
            }))
            
        res.status(201).json({ populatedComment, receipentsID, notification: { 
            type: "new_comment", 
            message: `${req.user?.name} commented (${content}) on card ${cardTitle}`, 
            link: `/workspaces/${workspace}/cards/${cardId}`,
            createdAt: new Date(),
        } });
    }
}
    catch(error){
        next(error);
    }
});

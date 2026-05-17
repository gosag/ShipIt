import type {Request, Response, NextFunction} from "express";
import { Card } from "../models/Card.js";
import asyncHandler from "express-async-handler";
import type { AuthRequest } from "../middleware/auth.js";
interface customError extends Error {
    status?: number;
}
export const createCard= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error= new Error("Not authenticated or no token!") as customError;
        error.status=401;
        throw error;
    }
     const {title,description,dueDate,order,assignee,priority,labels}=req.body;
     if(!title){
        const error= new Error("Title is required") as customError;
        error.status=400;
        throw error;
     }
     const columnId=req.params.columnId;
     const projectId=req.params.projectId;
     const workspaceId=req.params.workspaceId;
     if(!columnId || !projectId || !workspaceId){
        const error= new Error("Column ID, Project ID and Workspace ID are required") as customError;
        error.status=400;
        throw error;
     }
        const newCard= new Card({
            title,
            description,
            column: columnId,
            project: projectId,
            workspace: workspaceId,
            createdBy: req.user._id,
            dueDate,
            order,
            assignee,
            priority,
            labels
        });
        await newCard.save();
        if(!newCard){
            throw new Error("Failed to save the card to the database");
        }
        res.status(201).json(newCard);
})
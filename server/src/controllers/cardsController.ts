import type {Response, NextFunction} from "express";
import { Card } from "../models/Card.js";
import asyncHandler from "express-async-handler";
import type { AuthRequest } from "../middleware/auth.js";
import { Workspace } from "../models/Workspace.js";
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
export const updateCard= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error= new Error("Not authenticated or no token!") as customError;
        error.status=401;
        throw error;
    }
    const {title,description,dueDate,assignee,priority,labels}=req.body;
    const newFields:any={};
    if(title) newFields.title=title;
    if(description) newFields.description=description;
    if(dueDate) newFields.dueDate=dueDate;
    if(assignee) newFields.assignee=assignee;
    if(priority) newFields.priority=priority;
    if(labels) newFields.labels=labels;
    const cardId=req.params.cardId;

    const updatedCard= await Card.findByIdAndUpdate({ _id: cardId }, newFields, { new: true });
    if(!updatedCard){
        const error= new Error("Failed to update the card") as customError;
        error.status=404;
        throw error;
    }

    res.json(updatedCard);
})
export const moveCard= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error= new Error("Not authenticated or no token!") as customError;
        error.status=401;
        throw error;
    }
    const {newColumnId, newOrder}=req.body;
    if(!newColumnId || newOrder === undefined){
        const error= new Error("New column ID and new order are required") as customError;
        error.status=400;
        throw error;
    }
    const cardId=req.params.cardId;
    const newField:{column?:string, order?:string}={}
    if(newColumnId) newField.column=newColumnId;
    if(cardId) newField.order=newOrder
    const updatedCard= await Card.findByIdAndUpdate({ _id: cardId }, newField , { new: true });
    if(!updatedCard){
          throw new Error("Was unable to update the card") as customError;
    }
    res.json(updatedCard)
})
export const deleteCard= asyncHandler(async(req:AuthRequest,res:Response)=>{
    if(!req.user || !req.user._id){
        const error= new Error("Not authenticated or no token!") as customError;
        error.status=401;
        throw error;
    }
    const cardId=req.params.cardId;
    const cardToBeDeleted= await Card.findById(cardId);
    let WorkSpaceId="";
    if(cardToBeDeleted){
        WorkSpaceId= cardToBeDeleted.workspace.toString();
    }
    const workspace= await Workspace.findById(WorkSpaceId);
    
    if(!workspace){
        const error= new Error("Workspace not found") as customError;
        error.status=404;
        throw error;
    }
    const userInfoInWorkspace= workspace.members.find(member=> member.user.toString()=== req.user?._id.toString());
    if(!userInfoInWorkspace){
        const error= new Error("You are not a member of the workspace") as customError;
        error.status=403;
        throw error;
    }

    if((cardToBeDeleted?.createdBy.toString() !== req.user._id.toString())|| userInfoInWorkspace.role !== "admin"){
        const error= new Error("You are not authorized to delete this card") as customError;
        error.status=403;
        throw error;
    }
    await Card.findByIdAndDelete(cardId);
    res.json({ message: "Card deleted successfully" });
})
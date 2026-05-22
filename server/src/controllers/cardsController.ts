import type {Response, NextFunction} from "express";
import { Card } from "../models/Card.js";
import asyncHandler from "express-async-handler";
import type { AuthRequest } from "../middleware/auth.js";
import { Workspace } from "../models/Workspace.js";
import { Project } from "../models/Project.js";
interface customError extends Error {
    status?: number;
}
export const getCards = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id) {
        const error = new Error("Not authenticated or no token!") as customError;
        error.status = 401;
        throw error;
    }

    const { projectId, columnId } = req.params;

    if (!projectId || !columnId) {
        const error = new Error("Project ID, and Column ID are required") as customError;
        error.status = 400;
        throw error;
    }

    // Optionally populate assignee info or leave as just IDs
    const cards = await Card.find({
        project: projectId,
        column: columnId
    }).sort({ order: 1 });

    res.status(200).json(cards);
});

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
     
     if(!columnId || !projectId){
        const error= new Error("Column ID and Project ID are required") as customError;
        error.status=400;
        throw error;
     }

     const project = await Project.findById(projectId);
     if (!project) {
        const error= new Error("Project not found") as customError;
        error.status=404;
        throw error;
     }
     const workspaceId = project.workspace;

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
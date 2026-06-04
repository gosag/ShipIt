import type {Response, NextFunction} from "express";
import asyncHandler from "express-async-handler";
import type { AuthRequest } from "../middleware/auth.js";
import { Activity, Column, Project, Workspace, Card} from "../models/index.js";
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
     const {title,description,dueDate,order,assignees,priority,labels}=req.body;
     if(!title){
        const error= new Error("Title is required") as customError;
        error.status=400;
        throw error;
     }
     let labelsArray:string[]=[];
     if(labels && !Array.isArray(labels)){
         labelsArray=labels.split(",").map((label:string) => label.trim());
         console.log("Parsed labels array:", labelsArray);
     } else if(Array.isArray(labels)){
         labelsArray=labels;
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
            assignees,
            priority,
            labels: labelsArray
        });
        await newCard.save();
        if(!newCard){
            throw new Error("Failed to save the card to the database");
        }
        console.log("New card created:", newCard);
        res.status(201).json(newCard);
})
export const updateCard= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error= new Error("Not authenticated or no token!") as customError;
        error.status=401;
        throw error;
    }
    const {title,description,dueDate,assignees,priority,labels}=req.body;
    const newFields:any={};
    if(title) newFields.title=title;
    if(description) newFields.description=description;
    if(dueDate) newFields.dueDate=dueDate;
    if(assignees) newFields.assignees=assignees;
    if(priority) newFields.priority=priority;
    if(labels) {
        let labelsArray:string[]=[];
        if(labels && !Array.isArray(labels)){
            labelsArray=labels.split(",").map((label:string) => label.trim());
        } else if(Array.isArray(labels)){
            labelsArray=labels;
        }
        newFields.labels=labelsArray;
    }
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
    const column = await Column.findById(newColumnId);
    if(!column){
        const error= new Error("New column not found") as customError;
        error.status=404;
        throw error;
    }
    const columnTitle = column.title;
        const activity = new Activity({
            action: `Card titled:(${updatedCard.title}) moved to column ${columnTitle}`,
            card: updatedCard._id,
            project: updatedCard.project,
            workspace: updatedCard.workspace,
            user: req.user._id
        });

       const newActivity = await activity.save();

       if(!newActivity){
           throw new Error("Failed to save activity log") as customError;
       };

    res.json({updatedCard, newActivity});

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
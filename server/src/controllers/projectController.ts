import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { Project } from "../models/Project.js";
import { Column } from "../models/Column.js";
import asyncHandler from "express-async-handler";
interface customError extends Error {
    status?: number;
    statusCode?: number;
}
export const newProject= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        throw error;
    }
    const {name, description}= req.body;
    const workspace= req.params.workspaceId;
    if(!name || !workspace){
        const error = new Error("Name and workspace are required to create a project") as customError;
        error.status = 400;
        throw error;
    }
    const userId=req.user._id;
    const newProject= new Project({
        name,
        description,
        workspace,
        createdBy:userId,
    })
    const savedProject = await newProject.save();
    if(!savedProject){
        throw new Error("Failed to save the project to the database");
    }
    const columnNames=["To Do", "In Progress","Being Approved", "Done"];
    for(const columnName of columnNames){
        const newColumn= new Column({
            title: columnName,
            project: savedProject._id,
            workspace,
            order: columnNames.indexOf(columnName),
        })
        await newColumn.save();
        if(!newColumn){
            throw new Error("Failed to save the column to the database");
        }
    }
    res.status(201).json(savedProject);
})
export const getAllProjects= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        throw error;
    }
    const workspaceId=req.params.workspaceId;
    if(!workspaceId){
        const error = new Error("Workspace ID is required") as customError;
        error.status = 400;
        throw error;
    }
    const projects = await Project.find({workspace:workspaceId});
    if(!projects){
        const error = new Error("No projects found for the workspace") as customError;
        error.status = 404;
        throw error;
    }
    res.status(200).json(projects);
}
);
export const updateProject= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        throw error;
    }
    const projectId=req.params.projectId;
    if(!projectId){
        const error = new Error("Project ID is required") as customError;
        error.status = 400;
        throw error;
    }
    const {name, description}= req.body;
    const updateFields:{description?: string, name?:string}={};
    if(name) updateFields.name=name;
    if(description) updateFields.description=description;
     const updatedProject= await Project.findOneAndUpdate(
        {_id:projectId, createdBy:req.user._id} as any,
        {updateFields},
        {new:true}
     );
    if(!updatedProject){
        const error = new Error("Failed to update the project") as customError;
        error.status = 404;
        throw error;
    }
    res.status(200).json(updatedProject);
})
export const deleteProject= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        throw error;
    }
    const projectId=req.params.projectId;
    if(!projectId){
        const error = new Error("Project ID is required") as customError;
        error.status = 400;
        throw error;
    }
    const deletedProject= await Project.findOneAndDelete({_id:projectId, createdBy:req.user._id})
    if(!deletedProject){
        const error = new Error("Failed to delete the project") as customError;
        error.status = 404;
        throw error;
    }
    await Column.deleteMany({project:projectId});
    res.status(200).json({message:"Project deleted successfully", project:deletedProject});
});

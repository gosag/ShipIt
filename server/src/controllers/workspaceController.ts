import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { Workspace } from '../models/Workspace.js';
interface customError extends Error {
    status?: number;
    statusCode?: number;
}
export const createWorkspace=async(req:AuthRequest,res:Response,next:NextFunction)=>{
   if(!req.user || !req.user._id){
    const error = new Error("Unauthorized: User not authenticated") as customError;
    error.status = 401;
    return next(error);
   }
    const userId=req.user._id;

   const {name, slug, owner, members} = req.body;
    if(!name || !slug || !owner){
        const error = new Error("Name, slug, and owner are required to create a workspace") as customError;
        error.status = 400;
        next(error);
    }
    try{
        const existingWorkspace = await Workspace.findOne({slug});
        if(existingWorkspace){
            const error = new Error("A workspace with this slug already exists") as customError;
            error.status = 400;
            return next(error);
        }
        const newWorkspace= new Workspace({
            name,
            slug,
            owner:userId,
            members:[{user:userId, role:"admin"},members],
        })
        const savedWorkspace= await newWorkspace.save();
        if(!savedWorkspace){
            const error= new Error("Failed to save the data to the Database") as customError;
            error.status=500;
            throw error;
        }
        res.status(201).json(savedWorkspace);
    }catch(err){
        const error = new Error("Error checking for existing workspace") as customError;
        error.status = 500;
        return next(error);
    }
}
export const getAllWorkSpaces=async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error=new Error("Unauthorized: User not authenticated") as customError;
        error.status= 401;
        throw error;
    }
    const userId=req.user._id;
    const workspaces = await Workspace.find({members:{$elemMatch:{user:userId}}});
    if(!workspaces){
        const error = new Error("No workspaces found for the user") as customError;
        error.status = 404;
        return next(error);
    }
    res.status(200).json(workspaces);
}
export const updateWorkspace=async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error=new Error("Unauthorized: User not authenticated") as customError;
        error.status=401;
        throw error;}
    const userId=req.user._id;
    const workspaceId=req.params.id;
    const {name, slug, members}=req.body;
    const updateFields:{name?:string,slug?:string, members?:any}={};
    if(name) updateFields.name=name;
    if(slug) updateFields.slug=slug;
    if(members) updateFields.members=members;
    try{
        const updatedWorkspace= await Workspace.findOneAndUpdate(
            {_id:workspaceId, "members.user":userId} as any,
            {$set:updateFields},
            {new:true}
        );
        if(!updatedWorkspace){
            const error = new Error("Workspace not found or you are not the owner") as customError;
            error.status = 404;
            throw error;
        }
        res.status(200).json(updatedWorkspace);
    } catch (err) {
        const error = new Error("Error updating workspace") as customError;
        error.status = 500;
        throw error;
    }
}
export const deleteWorkspace=async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error=new Error("Unauthorized: User not authenticated") as customError;
        error.status=401;
        throw error;}
    const userId=req.user._id;
    const workspaceId=req.params.id;
    if(!workspaceId){
        const error = new Error("Workspace ID is required") as customError;
        error.status = 400;
        throw error;
    }

    try{
        const deletedWorkspace= await Workspace.findOneAndDelete(
            {_id:workspaceId, "members.user":userId} as any
        );
        if(!deletedWorkspace){
            const error = new Error("Workspace not found or you are not the owner") as customError;
            error.status = 404;
            throw error;
        }
        res.status(200).json({message:"Workspace deleted successfully"});
    } catch (err) {
        const error = new Error("Error deleting workspace") as customError;
        error.status = 500;
        throw error;
    }}

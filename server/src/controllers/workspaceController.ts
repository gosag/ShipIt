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
            members:[{user:userId, role:"admin"}] || [],
        })
        const savedWorkspace= await newWorkspace.save();
        res.status(201).json(savedWorkspace);
    }catch(err){
        const error = new Error("Error checking for existing workspace") as customError;
        error.status = 500;
        return next(error);
    }
}

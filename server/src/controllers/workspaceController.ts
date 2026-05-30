import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { Workspace } from '../models/Workspace.js';
import { Notification } from '../models/Notification.js';
import asyncHandler from 'express-async-handler';
interface customError extends Error {
    status?: number;
    statusCode?: number;
}
export const createWorkspace=asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
   if(!req.user || !req.user._id){
    const error = new Error("Unauthorized: User not authenticated") as customError;
    error.status = 401;
    return next(error);
   }
    const userId=req.user._id;

   const {name, slug, owner, members} = req.body;
    if(!name || !slug){
        const error = new Error("Name and slug are required to create a workspace") as customError;
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
        next(err);
    }
})
export const getAllWorkSpaces=asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error=new Error("Unauthorized: User not authenticated") as customError;
        error.status= 401;
        throw error;
    }
    const userId=req.user._id;
    const workspaces = await Workspace.find({members:{$elemMatch:{user:userId}}}).populate("members.user","name email");
    if(!workspaces){
        const error = new Error("No workspaces found for the user") as customError;
        error.status = 404;
        return next(error);
    }
    res.status(200).json(workspaces);
})
export const getWorkspaceBySlug=asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    const slug=req.params.slug as string;
    if(!req.user || !req.user._id){
        const error=new Error("Unauthorized: User not authenticated") as customError;
        error.status= 401;
        throw error;
    }
    if(!slug){
        const error = new Error("Workspace slug is required") as customError;
        error.status = 400;
        return next(error);
    }
    const workspace = await Workspace.findOne({slug:slug}).populate("owner"); 
    const owner = workspace?.owner as any;
   
    if(!workspace){
        const error = new Error("Workspace not found") as customError;
        error.status = 404;
        return next(error);
    }
     const workspaceData={
        userId: req.user._id,
        name: workspace?.name,
        workspaceId: workspace?._id,
        slug: workspace?.slug,
        creatorId: owner?._id || "Unknown",
        createdBy: owner?.name || "Unknown" 
    };
    console.log("Workspace data to return:", workspaceData);
    res.status(200).json(workspaceData);
})
export const getWorkspaceById=asyncHandler(async(req:AuthRequest, res:Response, next: NextFunction)=>{
    if(!req.user || !req.user._id){
        const error= new Error("Unauthorized: User is not authenticated") as customError;
        error.status=401;
        throw error;
    }
    const workspaceId= req.params.workspaceId;
    console.log("Received request for workspace with ID:", workspaceId);
    const workspace= await Workspace.findById(workspaceId);
    console.log("hey i reached here baby!")
    if(!workspace){
        const error= new Error("Workspace is not Found") as customError;
        error.status=404;
        throw error
    } 
    console.log(`Workspace found by ${workspaceId} is `,workspace);
    res.json(workspace)
})
export const updateWorkspace=asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
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
            {_id:workspaceId, members:{$elemMatch:{user:userId, role:"admin"}}} as any,
            {updateFields},
            {new:true}
        );
        if(!updatedWorkspace){
            const error = new Error("Workspace not found or you are not the owner") as customError;
            error.status = 404;
            throw error;
        }
        res.status(200).json(updatedWorkspace);
    } catch (err) {
        next(err);
    }
})
export const acceptJoinRequest=asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error=new Error("Unauthorized: User not authenticated") as customError;
        error.status=401;
        throw error;}
    const userId=req.user._id;
    const workspaceId=req.params.workspaceId;
    const notificationId=req.body.notificationId;
    if(!workspaceId || !notificationId){
        const error = new Error("Workspace ID and Notification ID are required") as customError;
        error.status = 400;
        throw error;
    }
  try{
    const notification = await Notification.findById(notificationId);
    if(!notification){
        const error = new Error("Notification not found") as customError;
        error.status = 404;
        throw error;
    }

    const workspace = await Workspace.findById(workspaceId);
    if(!workspace){
        const error = new Error("Workspace not found") as customError;
        error.status = 404;
        throw error;
    }
    const userToAddId = notification.sender;
    if (workspace.members.some((member) => member?.user?.toString() === userToAddId?.toString())) {
        await Notification.findByIdAndUpdate(notificationId, {status: "accepted"});
        res.status(200).json({message: "Join request accepted. User is already a member"});
        return;
    }

    const updatedWorkspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        {$push: {members: {user: userToAddId, role: "member"}}},
        {new: true}
    );
    if(!updatedWorkspace){
        const error = new Error("Failed to update workspace with new member") as customError;
        error.status = 500;
        throw error;
    }
    await Notification.findByIdAndUpdate(notificationId, {status: "accepted"});
    res.status(200).json({message: "Join request accepted and workspace updated"});
  } catch (err) {
    return next(err);
  }
})
export const rejectJoinRequest= asyncHandler( async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error=new Error("Unauthorized: User not authenticated") as customError;
        error.status=401;
        throw error;}
    const workspaceId=req.params.workspaceId;
    const notificationId=req.body.notificationId;
    if(!workspaceId || !notificationId){
        const error = new Error("Workspace ID and Notification ID are required") as customError;
        error.status = 400;
        throw error;
    }
    try{
        await Notification.findByIdAndUpdate(notificationId, {status: "rejected"});
        res.status(200).json({message: "Join request rejected"});
    } catch (err) {
        return next(err);
    }
})
export const deleteWorkspace=asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
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
            {_id:workspaceId, members:{$elemMatch:{user:userId, role:"admin"}}} as any
        );
        if(!deletedWorkspace){
            const error = new Error("Workspace not found or you are not the owner") as customError;
            error.status = 404;
            throw error;
        }
        res.status(200).json({message:"Workspace deleted successfully"});
    } catch (err) {
        next(err);
    }})
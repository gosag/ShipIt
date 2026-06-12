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
   let slug=req.body.slug;
   const {name, members} = req.body;
    if(!name || !slug){
        const error = new Error("Name and slug are required to create a workspace") as customError;
        error.status = 400;
        next(error);
    }
    try{
        const existingWorkspace = await Workspace.findOne({slug});
        if(existingWorkspace){
            const randomNumber = Math.floor(Math.random() * 999) +10;
            slug = `${slug}${randomNumber}`;
        }
        const initialMembers = [{ user: userId, role: "admin" as const }];
        if (Array.isArray(members)) {
            initialMembers.push(...members.filter((m: { user?: unknown }) => m?.user));
        }
        const newWorkspace= new Workspace({
            name,
            slug,
            owner:userId,
            members: initialMembers,
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
    const slug=req.params.slug as string ;
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
    const workspace= await Workspace.findById(workspaceId).populate("members.user","name email").populate("owner","name email");
    console.log("Workspace found:", workspace);
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
    const {name, slug, avatar}=req.body;
    const updateFields:{$set: Record<string, unknown>}={ $set: {} };
    if(name) updateFields.$set.name=name;
    if(slug) updateFields.$set.slug=slug;
    if(avatar !== undefined) updateFields.$set.avatar=avatar;
    if(Object.keys(updateFields.$set).length === 0){
        const error = new Error("No valid fields to update") as customError;
        error.status = 400;
        throw error;
    }
    try{
        const updatedWorkspace= await Workspace.findOneAndUpdate(
            {_id:workspaceId, members:{$elemMatch:{user:userId, role:"admin"}}} as any,
            updateFields,
            {new:true}
        ).populate("members.user","name email");
        if(!updatedWorkspace){
            const error = new Error("Workspace not found or you are not an admin") as customError;
            error.status = 404;
            throw error;
        }
        res.status(200).json(updatedWorkspace);
    } catch (err) {
        next(err);
    }
})

export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        throw error;
    }
    const { workspaceId, userId } = req.params;
    const workspace = await Workspace.findOne({
        _id: workspaceId,
        members: { $elemMatch: { user: req.user._id, role: "admin" } },
    } as any);
    if (!workspace) {
        const error = new Error("Workspace not found or you are not an admin") as customError;
        error.status = 404;
        throw error;
    }
    if (workspace.owner.toString() === userId) {
        const error = new Error("Cannot remove the workspace owner") as customError;
        error.status = 400;
        throw error;
    }
    const updated = await Workspace.findByIdAndUpdate(
        workspaceId,
        { $pull: { members: { user: userId } } },
        { new: true }
    ).populate("members.user", "name email");
    res.json(updated);
});

export const updateMemberRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        throw error;
    }
    const { workspaceId, userId } = req.params;
    const { role } = req.body;
    if (!role || !["admin", "member"].includes(role)) {
        const error = new Error("Role must be 'admin' or 'member'") as customError;
        error.status = 400;
        throw error;
    }
    const workspace = await Workspace.findOne({
        _id: workspaceId,
        members: { $elemMatch: { user: req.user._id, role: "admin" } },
    } as any);
    if (!workspace) {
        const error = new Error("Workspace not found or you are not an admin") as customError;
        error.status = 404;
        throw error;
    }
    if (workspace.owner.toString() === userId && role !== "admin") {
        const error = new Error("Cannot demote the workspace owner") as customError;
        error.status = 400;
        throw error;
    }
    const updated = await Workspace.findOneAndUpdate(
        { _id: workspaceId, "members.user": userId } as any,
        { $set: { "members.$.role": role } },
        { new: true }
    ).populate("members.user", "name email");
    if (!updated) {
        const error = new Error("Member not found") as customError;
        error.status = 404;
        throw error;
    }
    res.json(updated);
});
export const acceptJoinRequest=asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error=new Error("Unauthorized: User not authenticated") as customError;
        error.status=401;
        throw error;
    }
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
    }});
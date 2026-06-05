import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";
import { Workspace } from "../models/Workspace.js";
import { User } from "../models/User.js";
import asyncHandler from "express-async-handler";
interface customError extends Error {
    status?: number;
    statusCode?: number;
}
export const sendJoinRequest= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        return next(error);
    }
    const userInfo = await User.findById(req.user._id);
    if(!userInfo){
        const error = new Error("User not found") as customError;
        error.status = 404;
        return next(error);
    }
        const {workspaceId,  workspaceOwnerId, workSpaceName} = req.body;
        if(!workspaceId || !req.user._id || !workspaceOwnerId || !workSpaceName){
            const error = new Error("workspaceId, userId, workspaceOwnerId and workSpaceName are required") as customError;
            error.status = 400;
            return next(error);
        }
        const workspace = await Workspace.findById(workspaceId);
        if(!workspace){
            const error = new Error("Workspace not found") as customError;
            error.status = 404;
            return next(error);
        }
        if(workspace.members.some(member => member?.user?.toString() === req.user!._id.toString())){
            const error = new Error("You are already a member of the workspace") as customError;
            error.status = 400;
            return next(error);
        }
        console.log("Received join request:", { workspaceId, userId: req.user._id, workspaceOwnerId, workSpaceName });
        try{
            const newNotification = new Notification({
                type: "join_request",
                sender: req.user._id,
                senderName: userInfo.name,
                recipient: workspace.owner,
                workspace: workspaceId,
                message: `${userInfo.name} has requested to join workspace ${workSpaceName}`,
                link: `/workspaces/${workspaceId}/join-requests`
            });
            await newNotification.save();
            res.status(201).json({ message: "Join request sent successfully" });
        } catch (error: any) {
            console.error("Save error:", error);
            if(error.status){
                console.log("Error:", error);
                return next(error);
                
            }
            const customError = new Error("Internal server error") as customError;
            customError.status = 500;
            return next(customError);
        }
    }
);
export const getNotifications= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        return next(error);
    }
    try{
        const notifications = await Notification.find({recipient: req.user._id}).sort({createdAt: -1});
        res.status(200).json(notifications);
    } catch (error: any) {
        const customError = new Error("Internal server error") as customError;
        customError.status = 500;
        return next(customError);
    }
});
export const markNotificationRead = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        return next(error);
    }
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.recipient.toString() !== req.user._id) {
        const error = new Error("Notification not found") as customError;
        error.status = 404;
        return next(error);
    }
    notification.read = true;
    await notification.save();
    res.status(200).json(notification);
});

export const markAllNotificationsRead = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        return next(error);
    }
    await Notification.updateMany(
        { recipient: req.user._id, read: false },
        { read: true }
    );
    res.status(200).json({ message: "All notifications marked as read" });
});

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        return next(error);
    }
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.status(200).json({ count });
});

export const geYourNotificationsStatus= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        return next(error);
    }
    try{
        const notifications = await Notification.find({sender: req.user._id}).sort({createdAt: -1});
        res.status(200).json(notifications);
    }
    catch (error: any) {
        const customError = new Error("Internal server error") as customError;
        customError.status = 500;
        return next(customError);
    }
});

import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";
import { Workspace } from "../models/Workspace.js";
import { User } from "../models/User.js";
import NotificationSeen from "../models/notificationSeen.js";
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
                link: `/workspaces/${workspaceId}/join-requests`,
                status: "pending"
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
export const sendInvitationRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        return next(error);
    }
    console.log("Received invitation request:", { workspaceId: req.body.workspaceId, username: req.query.username });
    const { workspaceId} = req.body;
    const username = req.query.username as string;
    if(!username){
        const error = new Error("Username is required") as customError;
        error.status = 400;
        return next(error);
    }
    const recipient = await User.findOne({ username: username.trim() });
    if (!recipient) {
        const error = new Error("Recipient user not found") as customError;
        console.log("Error: Recipient user not found", { username });
        error.status = 404;
        return next(error);
    }

    if (!workspaceId) {
        const error = new Error("recipientId, workspaceId, and workspaceName are required") as customError;
        error.status = 400;
        return next(error);
    }
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        const error = new Error("Workspace not found") as customError;
        console.log("Error: Workspace not found", { workspaceId });
        error.status = 404;
        return next(error);
    }
    try {
        const newNotification = new Notification({
            type: "invitation",
            sender: req.user._id,
            senderName: req.user.name,
            recipient: recipient._id,
            workspace: workspaceId,
            message: `${req.user.name} has invited you to join workspace ${workspace.name}`,
            link: `/workspaces/${workspaceId}`,
            status: "pending"
        });
        await newNotification.save();
        res.status(201).json({ message: "Invitation notification sent successfully", receipentID: [recipient._id], notification: newNotification });
    } catch (error: any) {
        if (error.status) {
            return next(error);
        }
        next(error);
    }
});
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
    const lastRead = await NotificationSeen.findOne({ user: req.user._id});
    const lastReadDate = lastRead ? lastRead.lastReadAt : new Date(0);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, createdAt: { $gt: lastReadDate }, read: false }) || 0;
    res.status(200).json({ unreadCount });
});

export const getYourNotificationsStatus= asyncHandler(async(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !req.user._id){
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        return next(error);
    }
    try{
        const notifications = await Notification.find({sender: req.user._id, type:"join_request"}).sort({createdAt: -1});
        res.status(200).json(notifications);
    }
    catch (error: any) {
        const customError = new Error("Internal server error") as customError;
        customError.status = 500;
        return next(customError);
    }
});
export const updateNotificationsSeen = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?._id) {
        const error = new Error("Unauthorized: User not authenticated") as customError;
        error.status = 401;
        return next(error);
    }
    try {
        const result = await NotificationSeen.findOneAndUpdate(
            { user: req.user._id },
            { lastReadAt: new Date() },
            { upsert: true, new: true }
        );
        res.status(200).json({ message: "Notification seen data updated", data: result });
    } catch (error: any) {
        const customError = new Error("Internal server error") as customError;
        customError.status = 500;
        return next(customError);
    }
});

import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";
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
        const {workspaceId,  workspaceOwnerId, workSpaceName} = req.body;
        if(!workspaceId || !req.user._id || !workspaceOwnerId || !workSpaceName){
            const error = new Error("workspaceId, userId, workspaceOwnerId and workSpaceName are required") as customError;
            error.status = 400;
            return next(error);
        }
        console.log("Received join request:", { workspaceId, userId: req.user._id, workspaceOwnerId, workSpaceName });
        try{
            const newNotification = new Notification({
                type: "join_request",
                sender: req.user._id,
                recipient: workspaceOwnerId,
                workspace: workspaceId,
                message: `User ${req.user._id} has requested to join workspace ${workSpaceName}`,
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

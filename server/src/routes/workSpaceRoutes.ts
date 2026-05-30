import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {createWorkspace,getAllWorkSpaces, updateWorkspace,
     deleteWorkspace, getWorkspaceBySlug, acceptJoinRequest, rejectJoinRequest, getWorkspaceById} from "../controllers/workspaceController.js"
const workspaceRouter = express.Router();

workspaceRouter.post('/create',authenticate,createWorkspace);
workspaceRouter.get('/get-all',authenticate,getAllWorkSpaces);
workspaceRouter.get('/get-slug/:slug', authenticate, getWorkspaceBySlug);
workspaceRouter.get('/:workspaceId',authenticate, getWorkspaceById);
workspaceRouter.put('/update/:id',authenticate,updateWorkspace);
workspaceRouter.delete('/delete/:id',authenticate,deleteWorkspace);
workspaceRouter.put('/join-request/:workspaceId/accept', authenticate, acceptJoinRequest);
workspaceRouter.put('/join-request/:workspaceId/reject', authenticate, rejectJoinRequest);
export default workspaceRouter;
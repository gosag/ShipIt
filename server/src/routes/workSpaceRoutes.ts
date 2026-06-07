import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {createWorkspace,getAllWorkSpaces, updateWorkspace,
     deleteWorkspace, getWorkspaceBySlug, acceptJoinRequest, rejectJoinRequest, getWorkspaceById,
     removeMember, updateMemberRole} from "../controllers/workspaceController.js"
const workspaceRouter = express.Router();

workspaceRouter.post('/create',authenticate,createWorkspace);
workspaceRouter.get('/get-all',authenticate,getAllWorkSpaces);
workspaceRouter.get('/get-slug/:slug', authenticate, getWorkspaceBySlug);
workspaceRouter.put('/update/:id',authenticate,updateWorkspace);
workspaceRouter.delete('/delete/:id',authenticate,deleteWorkspace);
workspaceRouter.put('/join-request/:workspaceId/accept', authenticate, acceptJoinRequest);
workspaceRouter.put('/join-request/:workspaceId/reject', authenticate, rejectJoinRequest);
workspaceRouter.delete('/:workspaceId/members/:userId', authenticate, removeMember);
workspaceRouter.patch('/:workspaceId/members/:userId/role', authenticate, updateMemberRole);
workspaceRouter.get('/:workspaceId',authenticate, getWorkspaceById);
export default workspaceRouter;
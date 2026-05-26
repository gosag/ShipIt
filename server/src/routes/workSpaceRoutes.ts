import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {createWorkspace,getAllWorkSpaces, updateWorkspace, deleteWorkspace, getWorkspaceBySlug} from "../controllers/workspaceController.js"
const workspaceRouter = express.Router();

workspaceRouter.post('/create',authenticate,createWorkspace);
workspaceRouter.get('/get-all',authenticate,getAllWorkSpaces);
workspaceRouter.get('/get-slug/:slug', authenticate, getWorkspaceBySlug);
workspaceRouter.put('/update/:id',authenticate,updateWorkspace);
workspaceRouter.delete('/delete/:id',authenticate,deleteWorkspace);
export default workspaceRouter;
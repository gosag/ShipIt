import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {createWorkspace,getAllWorkSpaces, updateWorkspace, deleteWorkspace} from "../controllers/workspaceController.js"
const workspaceRouter = express.Router();

workspaceRouter.post('/create',authenticate,createWorkspace);
workspaceRouter.get('/get-all',authenticate,getAllWorkSpaces);
workspaceRouter.put('/update/:id',authenticate,updateWorkspace);
workspaceRouter.delete('/delete/:id',authenticate,deleteWorkspace);
export default workspaceRouter;
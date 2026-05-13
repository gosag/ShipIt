import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {createWorkspace} from "../controllers/workspaceController.js"
const workspaceRouter = express.Router();

workspaceRouter.post('/create',authenticate,createWorkspace)

export default workspaceRouter;
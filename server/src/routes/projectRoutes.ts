import express from "express";
import { authenticate } from "../middleware/auth.js";
const projectRouter = express.Router();
import {newProject, getAllProjects, updateProject,deleteProject} from "../controllers/projectController.js"
projectRouter.post('/create/:workspaceId', authenticate, newProject);
projectRouter.get('/getAll/:workspaceId', authenticate, getAllProjects);
projectRouter.put('/update/:id', authenticate, updateProject);
projectRouter.delete('/delete/:id', authenticate, deleteProject);
export default projectRouter;
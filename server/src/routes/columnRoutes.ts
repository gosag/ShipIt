import express from "express";
import { authenticate } from "../middleware/auth.js";
import { 
    createColumn, 
    getColumns, 
    updateColumn, 
    deleteColumn 
} from "../controllers/columnController.js";

const columnRouter = express.Router();

columnRouter.post('/:projectId', authenticate, createColumn);
columnRouter.get('/:projectId', authenticate, getColumns);
columnRouter.put('/:columnId', authenticate, updateColumn);
columnRouter.delete('/:columnId', authenticate, deleteColumn);

export default columnRouter;
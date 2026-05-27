import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendJoinRequest } from '../controllers/notificationController.js';
const notificationRouter = express.Router();
notificationRouter.post('/join-request', authenticate, sendJoinRequest);
export default notificationRouter;
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendJoinRequest, getNotifications } from '../controllers/notificationController.js';
const notificationRouter = express.Router();
notificationRouter.post('/join-request', authenticate, sendJoinRequest);
notificationRouter.get('/', authenticate, getNotifications);
export default notificationRouter;
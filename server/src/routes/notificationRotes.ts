import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendJoinRequest, getNotifications, geYourNotificationsStatus } from '../controllers/notificationController.js';
const notificationRouter = express.Router();
notificationRouter.post('/join-request', authenticate, sendJoinRequest);
notificationRouter.get('/', authenticate, getNotifications);
notificationRouter.get('/your-notifications', authenticate, geYourNotificationsStatus);
export default notificationRouter;
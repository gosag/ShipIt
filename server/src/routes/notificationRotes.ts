import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendJoinRequest, getNotifications, getYourNotificationsStatus, markNotificationRead, markAllNotificationsRead, getUnreadCount ,updateNotificationsSeen,
    sendInvitationRequest
} from '../controllers/notificationController.js';
const notificationRouter = express.Router();
notificationRouter.post('/join-request', authenticate, sendJoinRequest);
notificationRouter.get('/unread-count', authenticate, getUnreadCount);
notificationRouter.get('/your-notifications', authenticate, getYourNotificationsStatus);
notificationRouter.post('/invitation', authenticate, sendInvitationRequest);
notificationRouter.get('/', authenticate, getNotifications);
notificationRouter.patch('/read-all', authenticate, markAllNotificationsRead);
notificationRouter.patch('/:id/read', authenticate, markNotificationRead);
notificationRouter.put('/update-seen', authenticate, updateNotificationsSeen);
export default notificationRouter;
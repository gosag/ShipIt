import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getComments, sendComment } from '../controllers/messagesController.js';
const messagesRouter = express.Router();
messagesRouter.get('/get-messages/:cardId', authenticate, getComments);
messagesRouter.post('/send-message/:cardId', authenticate, sendComment);
export default messagesRouter;
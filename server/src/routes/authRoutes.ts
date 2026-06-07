import { Router } from 'express';
import {
  register, login, logout, refresh, userInfo,
  updateProfile, updateEmail, updatePassword, updateAvatar,
  deleteAccount, getNotificationPreferences, updateNotificationPreferences,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/user-info', authenticate, userInfo);
router.patch('/profile', authenticate, updateProfile);
router.patch('/email', authenticate, updateEmail);
router.patch('/password', authenticate, updatePassword);
router.patch('/avatar', authenticate, updateAvatar);
router.delete('/account', authenticate, deleteAccount);
router.get('/notification-preferences', authenticate, getNotificationPreferences);
router.patch('/notification-preferences', authenticate, updateNotificationPreferences);

export default router;

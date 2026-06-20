import { Router } from 'express';
import {
  register, login,googleCallback, logout, refresh, userInfo,
  updateProfile, updateEmail, updatePassword, updateAvatar,
  deleteAccount, getNotificationPreferences, updateNotificationPreferences,

} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import passport from 'passport';
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/register?error=google_auth_failed` }), googleCallback);
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

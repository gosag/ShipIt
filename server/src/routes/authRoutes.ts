import { Router } from 'express';
import { register, login, logout, refresh,userInfo} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/user-info',authenticate,userInfo)

export default router;

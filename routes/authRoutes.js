import express from 'express';
import { register, login } from '../controllers/authController.js';
//import { validateRegistration, validateLogin } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', register);
//router.get('/verify-email', verifyEmail);
router.post('/login', login);

export default router;


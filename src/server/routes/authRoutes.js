import express from 'express';
import { login, register, signup, updateProviderLocation, registerGarage } from '../controllers/authController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/register', register);
router.post('/login', login);
router.post('/register-garage', registerGarage);
router.patch('/provider/location', protect, updateProviderLocation);

export default router;

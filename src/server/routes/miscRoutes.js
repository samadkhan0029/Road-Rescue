import express from 'express';
import { reverseGeocode, sendOtp } from '../controllers/miscController.js';
import { aiChat, aiHealth } from '../controllers/aiController.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/geolocation/reverse', reverseGeocode);
router.get('/ai/health', aiHealth);
router.post('/ai/chat', aiChat);

export default router;

import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { optionalProtect } from '../middleware/protect.js';

const router = express.Router();

router.post('/create-order', optionalProtect, createOrder);
router.post('/verify', optionalProtect, verifyPayment);

export default router;

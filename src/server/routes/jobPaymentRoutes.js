import express from 'express';
import { verifyJobPayment, getPaymentStatus } from '../controllers/paymentController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

// POST /api/payments/verify - Verify post-job payment
router.post('/verify', protect, verifyJobPayment);

// GET /api/payments/:requestId - Get payment status for a request
router.get('/:requestId', protect, getPaymentStatus);

export default router;

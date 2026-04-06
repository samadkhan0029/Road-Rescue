import express from 'express';
import { getCustomerHistory } from '../controllers/requestController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

router.get('/rescue-history', protect, getCustomerHistory);

export default router;

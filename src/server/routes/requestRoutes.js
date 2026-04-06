import express from 'express';
import {
  getRequestById,
  acceptRequest,
  cancelRequest,
  cancelRequestByCustomer,
  completeRequest,
  createRequest,
  getAvailableRequests,
  getAvailableRequestsNearby,
  getProviderActiveJob,
  getRequestStatus,
  ignoreRequest,
  getCustomerHistory,
} from '../controllers/requestController.js';
import protect, { optionalProtect } from '../middleware/protect.js';

const router = express.Router();

router.post('/', optionalProtect, createRequest);
router.get('/status/:id', optionalProtect, getRequestStatus);
router.get('/provider/available', protect, getAvailableRequests);
router.get('/provider/available-nearby', protect, getAvailableRequestsNearby);
router.get('/provider/active', protect, getProviderActiveJob);
router.get('/customer/history', protect, getCustomerHistory);
router.patch('/accept/:id', protect, acceptRequest);
router.patch('/ignore/:id', protect, ignoreRequest);
router.patch('/cancel/:id', protect, cancelRequest);
router.patch('/customer-cancel/:id', optionalProtect, cancelRequestByCustomer);
router.patch('/complete/:id', protect, completeRequest);
router.get('/:id', optionalProtect, getRequestById);

export default router;

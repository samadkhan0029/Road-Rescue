import express from 'express';
import protect from '../middleware/protect.js';
import {
  getMessages,
  sendMessage,
  sendMessageFromBody,
  editMessage,
  unsendMessage,
  getChatHistory,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/history/:userId', protect, getChatHistory);
router.post('/send', protect, sendMessageFromBody);
router.get('/:requestId', protect, getMessages);
router.post('/:requestId', protect, sendMessage);
router.patch('/message/:messageId', protect, editMessage);
router.patch('/message/:messageId/unsend', protect, unsendMessage);

export default router;

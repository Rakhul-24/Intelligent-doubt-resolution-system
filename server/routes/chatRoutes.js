import express from 'express';
import {
  sendMessage,
  getChatHistory,
  getChats,
  getChatbotResponse,
  clearChatHistory,
  getUnreadCounts,
  markAsRead
} from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', authMiddleware, sendMessage);
router.get('/history/:userId', authMiddleware, getChatHistory);
router.get('/list', authMiddleware, getChats);
router.post('/chatbot', authMiddleware, getChatbotResponse);
router.delete('/history/:userId', authMiddleware, clearChatHistory);
router.get('/unread', authMiddleware, getUnreadCounts);
router.put('/read/:senderId', authMiddleware, markAsRead);

export default router;

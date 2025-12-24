const express = require('express');
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Get chat history between two users
router.get('/history/:userId', authMiddleware, chatController.getChatHistory);

// Get all chat conversations for current user
router.get('/conversations', authMiddleware, chatController.getConversations);

// Send a message (also handled via Socket.IO)
router.post('/send', authMiddleware, chatController.sendMessage);

// Get users available for chat (recruiters for users, users for recruiters)
router.get('/available-users', authMiddleware, chatController.getAvailableUsers);

module.exports = router;
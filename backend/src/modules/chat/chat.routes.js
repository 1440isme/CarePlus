const express = require('express');
const chatController = require('./chat.controller');
const {
  validateCreateConversation,
  validateSendMessage,
  validateGetMessages
} = require('./chat.validator');
const { CHAT_ROUTE_PATHS } = require('./chat.types');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

/**
 * Route: GET /api/v1/chat/conversations
 * List conversations of the logged-in user.
 */
router.get(CHAT_ROUTE_PATHS.CONVERSATIONS, chatController.listConversations);

/**
 * Route: POST /api/v1/chat/conversations
 * Get or create a conversation.
 */
router.post(CHAT_ROUTE_PATHS.CONVERSATIONS, validateCreateConversation, chatController.getOrCreateConversation);

/**
 * Route: GET /api/v1/chat/conversations/:id/messages
 * List messages in a conversation (paginated).
 */
router.get(CHAT_ROUTE_PATHS.MESSAGES, validateGetMessages, chatController.listMessages);

/**
 * Route: POST /api/v1/chat/conversations/:id/messages
 * Send a message to a conversation.
 */
router.post(CHAT_ROUTE_PATHS.MESSAGES, validateSendMessage, chatController.sendMessage);

module.exports = router;

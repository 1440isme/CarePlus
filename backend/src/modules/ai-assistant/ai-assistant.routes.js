const express = require('express');
const AIAssistantController = require('./ai-assistant.controller');
const { validateChatRequest } = require('./ai-assistant.validator');
const { AI_ASSISTANT_ROUTE_PATHS, AI_ASSISTANT_LIMITS } = require('./ai-assistant.types');
const { createRateLimiter } = require('../../middleware/rateLimiter.middleware');

const router = express.Router();

router.post(
  AI_ASSISTANT_ROUTE_PATHS.CHAT,
  createRateLimiter({
    action: 'ai-assistant-chat',
    limit: AI_ASSISTANT_LIMITS.CHAT_RATE_LIMIT,
    windowSeconds: AI_ASSISTANT_LIMITS.CHAT_RATE_WINDOW_SECONDS,
  }),
  validateChatRequest,
  AIAssistantController.chat,
);

module.exports = router;

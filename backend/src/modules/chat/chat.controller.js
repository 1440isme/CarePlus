const chatService = require('./chat.service');
const { ChatServiceError } = require('./chat.service');
const {
  toConversationDto,
  toConversationListDto,
  toMessageDto,
  toMessageListDto
} = require('./chat.dto');

class ChatController {
  /**
   * List conversations of the logged-in user.
   * GET /api/v1/chat/conversations
   */
  async listConversations(req, res, next) {
    try {
      const { userId, role } = req.user;
      const conversations = await chatService.listConversations(userId, role);
      
      return res.status(200).json({
        success: true,
        data: toConversationListDto(conversations, userId)
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Create or get a conversation.
   * POST /api/v1/chat/conversations
   */
  async getOrCreateConversation(req, res, next) {
    try {
      const { userId, role } = req.user;
      const conversation = await chatService.getOrCreateConversation(userId, role, req.body);
      
      return res.status(200).json({
        success: true,
        data: toConversationDto(conversation, userId)
      });
    } catch (error) {
      if (error instanceof ChatServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      }
      return next(error);
    }
  }

  /**
   * List messages in a conversation (paginated).
   * GET /api/v1/chat/conversations/:id/messages
   */
  async listMessages(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { id: conversationId } = req.params;
      
      const result = await chatService.listMessages(conversationId, userId, role, req.query);
      
      return res.status(200).json({
        success: true,
        data: toMessageListDto(result.data),
        meta: result.meta
      });
    } catch (error) {
      if (error instanceof ChatServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      }
      return next(error);
    }
  }

  /**
   * Send a message to a conversation.
   * POST /api/v1/chat/conversations/:id/messages
   */
  async sendMessage(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { id: conversationId } = req.params;
      
      const message = await chatService.sendMessage(conversationId, userId, role, req.body);
      
      return res.status(201).json({
        success: true,
        data: toMessageDto(message)
      });
    } catch (error) {
      if (error instanceof ChatServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      }
      return next(error);
    }
  }
}

module.exports = new ChatController();

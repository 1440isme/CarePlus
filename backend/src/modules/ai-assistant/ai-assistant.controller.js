const AIAssistantService = require('./ai-assistant.service');
const { toAiAssistantReplyDto } = require('./ai-assistant.dto');

class AIAssistantController {
  async chat(req, res, next) {
    try {
      const result = await AIAssistantService.chat(req.body);

      return res.status(200).json({
        success: true,
        data: toAiAssistantReplyDto(result.reply),
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AIAssistantController();

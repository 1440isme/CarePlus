const { z } = require('zod');
const { AI_ASSISTANT_ERROR_CODES, AI_ASSISTANT_LIMITS } = require('./ai-assistant.types');

const chatSchema = z.object({
  message: z.string().trim().min(1).max(AI_ASSISTANT_LIMITS.MESSAGE_MAX_LENGTH),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().trim().min(1).max(AI_ASSISTANT_LIMITS.MESSAGE_MAX_LENGTH),
    }).strict(),
  ).max(AI_ASSISTANT_LIMITS.HISTORY_MAX_ITEMS).optional(),
}).strict();

function mapIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }));
}

function validateChatRequest(req, res, next) {
  const parsed = chatSchema.safeParse(req.body || {});

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: AI_ASSISTANT_ERROR_CODES.VALIDATION_ERROR,
        message: 'Dữ liệu không hợp lệ',
        details: mapIssues(parsed.error.issues),
      },
    });
  }

  req.body = parsed.data;
  return next();
}

module.exports = {
  chatSchema,
  validateChatRequest,
};

const { z } = require('zod');
const { CHAT_ERROR_CODES, CHAT_PAGINATION } = require('./chat.types');

function sendValidationError(res, details, code = CHAT_ERROR_CODES.VALIDATION_ERROR, message = 'Dữ liệu không hợp lệ') {
  return res.status(400).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

function mapIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }));
}

const createConversationSchema = z.object({
  type: z.enum(['SUPPORT', 'DOCTOR_CONSULTATION']),
  doctorId: z.string().min(1, 'ID bác sĩ không được trống').optional(),
}).strict().refine(
  (data) => data.type !== 'DOCTOR_CONSULTATION' || !!data.doctorId,
  {
    message: 'doctorId là bắt buộc đối với loại hội thoại DOCTOR_CONSULTATION',
    path: ['doctorId'],
  }
);

const sendMessageSchema = z.object({
  message: z.string().trim().min(1, 'Nội dung tin nhắn không được để trống'),
  messageType: z.enum(['TEXT', 'FILE']).default('TEXT'),
}).strict();

const getMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(CHAT_PAGINATION.MAX_LIMIT).optional(),
}).strict();

function validateCreateConversation(req, res, next) {
  const parsedResult = createConversationSchema.safeParse(req.body || {});
  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues));
  }
  req.body = parsedResult.data;
  return next();
}

function validateSendMessage(req, res, next) {
  const parsedResult = sendMessageSchema.safeParse(req.body || {});
  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues));
  }
  req.body = parsedResult.data;
  return next();
}

function validateGetMessages(req, res, next) {
  const parsedResult = getMessagesQuerySchema.safeParse(req.query || {});
  if (!parsedResult.success) {
    return sendValidationError(res, mapIssues(parsedResult.error.issues));
  }
  req.query = parsedResult.data;
  return next();
}

module.exports = {
  validateCreateConversation,
  validateSendMessage,
  validateGetMessages,
};

const AI_ASSISTANT_ROUTE_PATHS = {
  CHAT: '/chat',
};

const AI_ASSISTANT_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AI_ASSISTANT_FAILED: 'AI_ASSISTANT_FAILED',
  AI_ASSISTANT_CONTEXT_UNAVAILABLE: 'AI_ASSISTANT_CONTEXT_UNAVAILABLE',
  GEMINI_UNAVAILABLE: 'GEMINI_UNAVAILABLE',
};

const AI_ASSISTANT_LIMITS = {
  MESSAGE_MAX_LENGTH: 1000,
  HISTORY_MAX_ITEMS: 10,
  DEFAULT_CONTEXT_ITEMS: 10,
  MAX_CONTEXT_ITEMS: 10,
  MAX_BLOG_ITEMS: 5,
  CHAT_RATE_LIMIT: 10,
  CHAT_RATE_WINDOW_SECONDS: 60,
};

const AI_ASSISTANT_MESSAGES = {
  DISABLED: 'CarePlus AI hiện chưa được bật. Vui lòng thử lại sau.',
  OUT_OF_SCOPE:
    'Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến CarePlus như thông tin phòng khám, chuyên khoa, bác sĩ, bài viết sức khỏe và hướng dẫn sử dụng hệ thống.',
  NO_DATA: 'Hiện tại tôi chưa có thông tin phù hợp trong hệ thống CarePlus.',
  CONTEXT_UNAVAILABLE: 'Hiện tại tôi chưa lấy được dữ liệu CarePlus, vui lòng thử lại sau.',
  FAILED: 'Hiện tại CarePlus AI chưa thể phản hồi. Vui lòng thử lại sau.',
  MEDICAL_SAFETY:
    'Tôi không thể chẩn đoán bệnh. Với triệu chứng bạn mô tả, bạn nên liên hệ bác sĩ hoặc cơ sở y tế gần nhất để được kiểm tra kịp thời. Thông tin này chỉ mang tính tham khảo, không thay thế tư vấn trực tiếp từ bác sĩ.',
};

module.exports = {
  AI_ASSISTANT_ROUTE_PATHS,
  AI_ASSISTANT_ERROR_CODES,
  AI_ASSISTANT_LIMITS,
  AI_ASSISTANT_MESSAGES,
};

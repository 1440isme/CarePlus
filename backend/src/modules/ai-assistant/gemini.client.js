const { AI_ASSISTANT_ERROR_CODES } = require('./ai-assistant.types');

class GeminiClientError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class GeminiClient {
  async generateReply({ systemInstruction, contextText, history = [], message }) {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      throw new GeminiClientError({
        code: AI_ASSISTANT_ERROR_CODES.GEMINI_UNAVAILABLE,
        message: 'Gemini API key chưa được cấu hình',
        statusCode: 503,
      });
    }

    const contents = history.map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    }));

    contents.push({
      role: 'user',
      parts: [{
        text: [
          `Ngữ cảnh CarePlus an toàn đã lọc:`,
          contextText,
          '',
          `Câu hỏi người dùng: ${message}`,
        ].join('\n'),
      }],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 20,
            maxOutputTokens: 512,
          },
        }),
      },
    );

    if (!response.ok) {
      let details = [];

      try {
        const errorPayload = await response.json();
        details = errorPayload?.error?.message ? [{ message: errorPayload.error.message }] : [];
      } catch (error) {
        details = [];
      }

      throw new GeminiClientError({
        code: AI_ASSISTANT_ERROR_CODES.GEMINI_UNAVAILABLE,
        message: 'Không thể gọi Gemini API',
        statusCode: 503,
        details,
      });
    }

    const payload = await response.json();
    const reply = payload?.candidates
      ?.flatMap((candidate) => candidate?.content?.parts || [])
      ?.map((part) => part?.text || '')
      ?.join('\n')
      ?.trim();

    if (!reply) {
      throw new GeminiClientError({
        code: AI_ASSISTANT_ERROR_CODES.GEMINI_UNAVAILABLE,
        message: 'Gemini không trả về nội dung phản hồi',
        statusCode: 503,
      });
    }

    return reply;
  }
}

module.exports = new GeminiClient();

const AIAssistantRepository = require('./ai-assistant.repository');
const GeminiClient = require('./gemini.client');
const {
  AI_ASSISTANT_ERROR_CODES,
  AI_ASSISTANT_LIMITS,
  AI_ASSISTANT_MESSAGES,
} = require('./ai-assistant.types');

const SYSTEM_INSTRUCTION = `
Bạn là CarePlus AI, trợ lý hỗ trợ người dùng của hệ thống CarePlus.

Bạn chỉ được trả lời các câu hỏi liên quan đến CarePlus, bao gồm:
- thông tin phòng khám
- giờ làm việc, hotline, địa chỉ
- chuyên khoa
- bác sĩ công khai
- quy định đặt lịch/hủy lịch
- hướng dẫn sử dụng hệ thống
- blog/bài viết sức khỏe public

Bạn chỉ được sử dụng dữ liệu hệ thống được cung cấp trong context. Không được tự bịa dữ liệu.

Nếu không có thông tin trong context, hãy nói chưa có dữ liệu phù hợp và gợi ý người dùng liên hệ phòng khám hoặc thử câu hỏi khác.

Không được chẩn đoán bệnh, kê đơn thuốc hoặc đưa ra chỉ định y tế chắc chắn.

Nếu người dùng mô tả triệu chứng nghiêm trọng, hãy khuyên họ liên hệ bác sĩ hoặc cơ sở y tế gần nhất.

Nếu câu hỏi ngoài phạm vi CarePlus, hãy từ chối lịch sự.

Không được tiết lộ hoặc yêu cầu các thông tin nhạy cảm như mật khẩu, OTP, token, dữ liệu cá nhân của người khác.

Khi trả lời nội dung sức khỏe tham khảo từ blog public, phải nhắc rằng thông tin chỉ mang tính tham khảo và không thay thế tư vấn trực tiếp từ bác sĩ.
`.trim();

const OUT_OF_SCOPE_KEYWORDS = [
  'react',
  'javascript',
  'typescript',
  'code',
  'lap trinh',
  'bitcoin',
  'crypto',
  'gia vang',
  'game',
  'the thao',
  'chung khoan',
];

const SENSITIVE_KEYWORDS = [
  'password',
  'mat khau',
  'passwordhash',
  'otp',
  'token',
  'refresh token',
  'access token',
  'reset token',
  'danh sach toan bo user',
  'toan bo user',
  'danh sach email',
  'so dien thoai nguoi dung',
  'lich kham cua nguoi khac',
  'ho so nguoi khac',
  'database',
  'db',
  'prisma',
  'admin internal',
];

const SEVERE_MEDICAL_KEYWORDS = [
  'dau nguc',
  'kho tho',
  'ngat',
  'co giat',
  'dot quy',
  'chay mau nhieu',
];

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd');
}

function truncateText(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3)}...`;
}

class AIAssistantServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class AIAssistantService {
  constructor(repository, geminiClient) {
    this.repository = repository;
    this.geminiClient = geminiClient;
  }

  async chat(payload) {
    const message = payload.message.trim();
    const history = Array.isArray(payload.history) ? payload.history : [];

    if (!this._isAssistantEnabled()) {
      return { reply: AI_ASSISTANT_MESSAGES.DISABLED };
    }

    if (this._isSensitiveRequest(message) || this._isObviouslyOutOfScope(message)) {
      return { reply: AI_ASSISTANT_MESSAGES.OUT_OF_SCOPE };
    }

    if (this._isSevereMedicalQuestion(message)) {
      return {
        reply: `${AI_ASSISTANT_MESSAGES.MEDICAL_SAFETY} Tại CarePlus, bạn có thể tham khảo chuyên khoa Tim mạch hoặc Nội tổng quát nếu hệ thống có dữ liệu phù hợp.`,
      };
    }

    let context;

    try {
      context = await this._buildContext(message);
    } catch (error) {
      throw this._wrapError(
        error,
        AI_ASSISTANT_ERROR_CODES.AI_ASSISTANT_CONTEXT_UNAVAILABLE,
        AI_ASSISTANT_MESSAGES.CONTEXT_UNAVAILABLE,
        503,
      );
    }

    if (!context.hasAnyData) {
      return { reply: AI_ASSISTANT_MESSAGES.NO_DATA };
    }

    try {
      const reply = await this.geminiClient.generateReply({
        systemInstruction: SYSTEM_INSTRUCTION,
        contextText: context.contextText,
        history,
        message,
      });

      return {
        reply: truncateText(reply, 4000),
      };
    } catch (error) {
      throw this._wrapError(
        error,
        AI_ASSISTANT_ERROR_CODES.AI_ASSISTANT_FAILED,
        AI_ASSISTANT_MESSAGES.FAILED,
        503,
      );
    }
  }

  async _buildContext(message) {
    const contextItemLimit = this._resolveContextItemLimit();
    const blogLimit = Math.min(contextItemLimit, AI_ASSISTANT_LIMITS.MAX_BLOG_ITEMS);

    const [clinicInfo, bookingRules, specialties, doctors, blogs] = await Promise.all([
      this.repository.getClinicInfo(),
      this.repository.getBookingRules(),
      this.repository.findRelevantSpecialties(message, contextItemLimit),
      this.repository.findRelevantDoctors(message, contextItemLimit),
      this.repository.findRelevantBlogs(message, blogLimit),
    ]);

    const guidance = this._buildGuidanceContext(message, bookingRules);

    const formattedBlogs = blogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      summary: blog.summary || '',
      excerpt: truncateText(blog.content, 280),
      tags: typeof blog.tags === 'string'
        ? blog.tags.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
      publishedAt: blog.createdAt,
      authorName: blog.author?.name || null,
    }));

    const safeContext = {
      clinicInfo: clinicInfo ? {
        name: clinicInfo.name,
        address: clinicInfo.address,
        hotline: clinicInfo.hotline,
        email: clinicInfo.email,
        workingHours: clinicInfo.workingHours,
        description: clinicInfo.description,
      } : null,
      bookingRules: bookingRules ? {
        maxBookingDaysAhead: bookingRules.maxBookingDaysAhead,
        slotDurationMinutes: bookingRules.slotDurationMinutes,
        cancelBeforeHours: bookingRules.cancelBeforeHours,
        workingShifts: {
          morning: {
            start: bookingRules.morningShiftStart,
            end: bookingRules.morningShiftEnd,
          },
          afternoon: {
            start: bookingRules.afternoonShiftStart,
            end: bookingRules.afternoonShiftEnd,
          },
        },
      } : null,
      specialties: specialties.map((specialty) => ({
        id: specialty.id,
        name: specialty.name,
        slug: specialty.slug,
        description: truncateText(specialty.description, 200),
        icon: specialty.icon,
        doctorCount: specialty.doctorCount,
      })),
      doctors: doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        title: doctor.title,
        specialtyName: doctor.specialtyName,
        yearsOfExperience: doctor.experience,
        consultationFee: doctor.price,
        avatarUrl: doctor.avatar,
        bio: truncateText(doctor.description, 240),
        position: doctor.position,
        active: doctor.active,
      })),
      blogs: formattedBlogs,
      guidance,
    };

    return {
      hasAnyData: Boolean(
        safeContext.clinicInfo
        || safeContext.bookingRules
        || safeContext.specialties.length
        || safeContext.doctors.length
        || safeContext.blogs.length
        || safeContext.guidance.length,
      ),
      contextText: JSON.stringify(safeContext, null, 2),
    };
  }

  _buildGuidanceContext(message, bookingRules) {
    const normalizedMessage = normalizeText(message);
    const guidance = [];

    if (normalizedMessage.includes('nguoi than') || normalizedMessage.includes('ho so')) {
      guidance.push(
        'Huong dan them ho so nguoi than: dang nhap tai khoan benh nhan -> vao trang /benh-nhan/nguoi-than -> chon them ho so -> nhap ho ten, so dien thoai, gioi tinh, ngay sinh, moi quan he va dia chi neu can -> luu ho so.',
      );
    }

    if (normalizedMessage.includes('dat lich') || normalizedMessage.includes('booking') || normalizedMessage.includes('lich kham')) {
      guidance.push(
        `Huong dan dat lich: chon chuyen khoa -> chon bac si va khung gio con trong -> chon nguoi duoc kham -> xac nhan lich hen. So ngay dat truoc toi da hien tai la ${bookingRules?.maxBookingDaysAhead ?? 'theo cau hinh he thong'} ngay.`,
      );
    }

    if (normalizedMessage.includes('huy lich')) {
      guidance.push(
        `Quy dinh huy lich: neu con du thoi gian truoc gio kham theo cau hinh he thong thi co the huy truc tiep. Cau hinh hien tai yeu cau huy truoc toi thieu ${bookingRules?.cancelBeforeHours ?? 'theo cau hinh he thong'} gio.`,
      );
    }

    if (normalizedMessage.includes('gio lam viec') || normalizedMessage.includes('working hour')) {
      guidance.push('Neu can gio lam viec chi tiet theo ca, uu tien dung du lieu workingHours va workingShifts trong context.');
    }

    return guidance;
  }

  _isAssistantEnabled() {
    return String(process.env.AI_ASSISTANT_ENABLED || 'true').toLowerCase() !== 'false';
  }

  _resolveContextItemLimit() {
    const rawValue = Number.parseInt(process.env.AI_ASSISTANT_MAX_CONTEXT_ITEMS, 10);

    if (!Number.isInteger(rawValue) || rawValue < 1) {
      return AI_ASSISTANT_LIMITS.DEFAULT_CONTEXT_ITEMS;
    }

    return Math.min(rawValue, AI_ASSISTANT_LIMITS.MAX_CONTEXT_ITEMS);
  }

  _isSensitiveRequest(message) {
    const normalizedMessage = normalizeText(message);
    return SENSITIVE_KEYWORDS.some((keyword) => normalizedMessage.includes(keyword));
  }

  _isObviouslyOutOfScope(message) {
    const normalizedMessage = normalizeText(message);
    return OUT_OF_SCOPE_KEYWORDS.some((keyword) => normalizedMessage.includes(keyword));
  }

  _isSevereMedicalQuestion(message) {
    const normalizedMessage = normalizeText(message);
    return SEVERE_MEDICAL_KEYWORDS.some((keyword) => normalizedMessage.includes(keyword));
  }

  _wrapError(error, code, message, statusCode) {
    if (error instanceof AIAssistantServiceError || (error && error.code && error.statusCode)) {
      return error;
    }

    return new AIAssistantServiceError({
      code,
      message,
      statusCode,
      details: error?.message ? [{ message: error.message }] : [],
    });
  }
}

module.exports = new AIAssistantService(AIAssistantRepository, GeminiClient);

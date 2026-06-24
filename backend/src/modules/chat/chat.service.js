const prisma = require('../../infrastructure/database/prisma.client');
const conversationRepository = require('./conversation.repository');
const messageRepository = require('./message.repository');
const socketService = require('../../infrastructure/realtime/socket.service');
const { CHAT_ERROR_CODES } = require('./chat.types');

class ChatServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ChatService {
  /**
   * Helper to fetch doctor profile by userId
   */
  async _getDoctorProfileByUserId(userId) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId }
    });
    if (!doctor) {
      throw new ChatServiceError({
        code: CHAT_ERROR_CODES.UNAUTHORIZED_PARTICIPANT,
        message: 'Tài khoản bác sĩ không tồn tại hoặc chưa được thiết lập hồ sơ',
        statusCode: 403
      });
    }
    return doctor;
  }

  /**
   * Get list of conversations for a user based on their role.
   */
  async listConversations(userId, role) {
    const includeOptions = {
      patient: true,
      doctor: true,
      receptionist: true,
      messages: {
        select: {
          senderId: true,
          isRead: true
        }
      }
    };

    let whereClause = {};

    if (role === 'ADMIN' || role === 'RECEPTIONIST') {
      // Receptionist & Admin can see all SUPPORT conversations
      whereClause = { type: 'SUPPORT' };
    } else if (role === 'PATIENT') {
      whereClause = { patientId: userId };
    } else if (role === 'DOCTOR') {
      const doctor = await this._getDoctorProfileByUserId(userId);
      whereClause = { doctorId: doctor.id };
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: includeOptions,
      orderBy: { lastMessageAt: 'desc' }
    });

    return conversations;
  }

  /**
   * Create a new conversation or get an existing one.
   */
  async getOrCreateConversation(userId, role, { type, doctorId }) {
    if (role !== 'PATIENT') {
      throw new ChatServiceError({
        code: CHAT_ERROR_CODES.UNAUTHORIZED_PARTICIPANT,
        message: 'Chỉ bệnh nhân mới có thể tạo cuộc trò chuyện mới',
        statusCode: 403
      });
    }

    const includeOptions = {
      patient: true,
      doctor: true,
      receptionist: true,
      messages: {
        select: {
          senderId: true,
          isRead: true
        }
      }
    };

    if (type === 'SUPPORT') {
      // Find existing active SUPPORT chat for patient
      const existing = await prisma.conversation.findFirst({
        where: {
          patientId: userId,
          type: 'SUPPORT',
          status: 'ACTIVE'
        },
        include: includeOptions
      });

      if (existing) return existing;

      // Create new SUPPORT conversation
      const createdConv = await prisma.conversation.create({
        data: {
          type: 'SUPPORT',
          patientId: userId,
          status: 'ACTIVE',
          lastMessage: 'Cuộc trò chuyện hỗ trợ được tạo',
          lastMessageAt: new Date()
        },
        include: includeOptions
      });

      // Emit conversation:created event to receptionists
      try {
        socketService.emitToRole('RECEPTIONIST', 'conversation:created', toConversationDto(createdConv, null));
      } catch (socketErr) {
        console.error('Failed to emit conversation:created socket event to receptionists:', socketErr.message);
      }

      return createdConv;
    } else if (type === 'DOCTOR_CONSULTATION') {
      // Verify doctor exists
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId }
      });
      if (!doctor) {
        throw new ChatServiceError({
          code: CHAT_ERROR_CODES.INVALID_RECIPIENT,
          message: 'Bác sĩ không tồn tại',
          statusCode: 404
        });
      }

      // Find existing active DOCTOR_CONSULTATION chat
      const existing = await prisma.conversation.findFirst({
        where: {
          patientId: userId,
          doctorId,
          type: 'DOCTOR_CONSULTATION',
          status: 'ACTIVE'
        },
        include: includeOptions
      });

      if (existing) return existing;

      // Create new DOCTOR_CONSULTATION conversation
      const createdConv = await prisma.conversation.create({
        data: {
          type: 'DOCTOR_CONSULTATION',
          patientId: userId,
          doctorId,
          status: 'ACTIVE',
          lastMessage: 'Cuộc trò chuyện tư vấn y khoa được tạo',
          lastMessageAt: new Date()
        },
        include: includeOptions
      });

      // Emit conversation:created event to the doctor
      try {
        if (doctor?.userId) {
          socketService.emitToUser(doctor.userId, 'conversation:created', toConversationDto(createdConv, doctor.userId));
        }
      } catch (socketErr) {
        console.error('Failed to emit conversation:created socket event:', socketErr.message);
      }

      return createdConv;
    }
  }

  /**
   * Get messages in a conversation (paginated) and mark them as read.
   */
  async listMessages(conversationId, userId, role, filters = {}) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 50;

    // Verify conversation exists and user has access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      throw new ChatServiceError({
        code: CHAT_ERROR_CODES.CONVERSATION_NOT_FOUND,
        message: 'Cuộc trò chuyện không tồn tại',
        statusCode: 404
      });
    }

    let hasAccess = false;
    let doctorId = null;

    if (role === 'ADMIN') {
      hasAccess = true;
    } else if (role === 'RECEPTIONIST') {
      hasAccess = conversation.type === 'SUPPORT';
    } else if (role === 'PATIENT') {
      hasAccess = conversation.patientId === userId;
    } else if (role === 'DOCTOR') {
      const doctor = await this._getDoctorProfileByUserId(userId);
      doctorId = doctor.id;
      hasAccess = conversation.doctorId === doctorId;
    }

    if (!hasAccess) {
      throw new ChatServiceError({
        code: CHAT_ERROR_CODES.UNAUTHORIZED_PARTICIPANT,
        message: 'Bạn không có quyền truy cập cuộc trò chuyện này',
        statusCode: 403
      });
    }

    // Mark unread messages sent by others in this conversation as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    // Notify other clients in the conversation that messages were read
    socketService.emitToRoom(`conversation:${conversationId}`, 'chat:messages-read', {
      conversationId,
      userId
    });

    // Fetch messages (paginated)
    const result = await messageRepository.findMany({
      page,
      limit,
      conversationId,
      sortBy: 'createdAt',
      sortOrder: 'asc' // Chronological order
    });

    return result;
  }

  /**
   * Send a message to a conversation.
   */
  async sendMessage(conversationId, senderId, senderRole, { message, messageType = 'TEXT' }) {
    // 1. Fetch conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      throw new ChatServiceError({
        code: CHAT_ERROR_CODES.CONVERSATION_NOT_FOUND,
        message: 'Cuộc trò chuyện không tồn tại',
        statusCode: 404
      });
    }

    // 2. Access verification
    let hasAccess = false;
    let doctorId = null;

    if (senderRole === 'ADMIN') {
      hasAccess = true;
    } else if (senderRole === 'RECEPTIONIST') {
      hasAccess = conversation.type === 'SUPPORT';
    } else if (senderRole === 'PATIENT') {
      hasAccess = conversation.patientId === senderId;
    } else if (senderRole === 'DOCTOR') {
      const doctor = await this._getDoctorProfileByUserId(senderId);
      doctorId = doctor.id;
      hasAccess = conversation.doctorId === doctorId;
    }

    if (!hasAccess) {
      throw new ChatServiceError({
        code: CHAT_ERROR_CODES.UNAUTHORIZED_PARTICIPANT,
        message: 'Bạn không có quyền gửi tin nhắn vào cuộc trò chuyện này',
        statusCode: 403
      });
    }

    // 3. Auto-assign receptionist to SUPPORT chat if not assigned yet
    let receptionistUpdate = {};
    if (senderRole === 'RECEPTIONIST' && conversation.type === 'SUPPORT' && !conversation.receptionistId) {
      receptionistUpdate = { receptionistId: senderId };
    }

    // 4. Create Message
    const createdMessage = await messageRepository.create({
      conversationId,
      senderId,
      senderRole,
      message,
      messageType,
      isRead: false
    });

    // 5. Update Conversation last message fields
    const displayMessage = messageType === 'FILE' ? '[Hình ảnh/Tệp tin]' : message;
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: displayMessage,
        lastMessageAt: new Date(),
        ...receptionistUpdate
      }
    });

    // 6. Determine recipient ID to emit unread badge notification
    let recipientId = null;
    if (conversation.type === 'SUPPORT') {
      if (senderRole === 'PATIENT') {
        recipientId = conversation.receptionistId; // null if unassigned, so receptionist role room gets it
      } else {
        recipientId = conversation.patientId;
      }
    } else if (conversation.type === 'DOCTOR_CONSULTATION') {
      if (senderRole === 'PATIENT') {
        // Recipient is doctor user
        const doctor = await prisma.doctor.findUnique({
          where: { id: conversation.doctorId }
        });
        recipientId = doctor?.userId;
      } else {
        recipientId = conversation.patientId;
      }
    }

    // 7. Emit events
    const messagePayload = {
      id: createdMessage.id,
      conversationId,
      senderId,
      senderRole,
      message: createdMessage.message,
      messageType: createdMessage.messageType,
      isRead: false,
      createdAt: createdMessage.createdAt
    };

    // Fetch sender user name for premium chat notifications
    const senderUser = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true }
    });
    const senderName = senderUser?.name || 'Người dùng';

    // Emit to conversation room (real-time chat window updates)
    socketService.emitToRoom(`conversation:${conversationId}`, 'chat:message-received', messagePayload);

    // Emit to recipient user room or role room (for unread counts & toast notifications)
    if (recipientId) {
      const isRecipientPatient = recipientId === conversation.patientId;
      const targetLink = isRecipientPatient
        ? null
        : (conversation.type === 'SUPPORT' ? '/portal/le-tan/tin-nhan' : '/portal/bac-si/tin-nhan');

      socketService.emitToUser(recipientId, 'notification:new', {
        id: createdMessage.id,
        type: 'CHAT',
        title: 'Tin nhắn mới',
        content: `${senderName}: ${displayMessage}`,
        conversationId,
        senderId,
        link: targetLink
      });
    } else if (conversation.type === 'SUPPORT' && senderRole === 'PATIENT') {
      // Broadcast to all receptionists if SUPPORT chat is unassigned
      socketService.emitToRole('RECEPTIONIST', 'notification:new', {
        id: createdMessage.id,
        type: 'CHAT',
        title: 'Tin nhắn hỗ trợ mới',
        content: `${senderName}: ${displayMessage}`,
        conversationId,
        senderId,
        link: '/portal/le-tan/tin-nhan'
      });
    }

    return createdMessage;
  }
}

module.exports = new ChatService();
module.exports.ChatServiceError = ChatServiceError;

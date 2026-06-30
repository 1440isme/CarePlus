function toConversationDto(conv, currentUserId) {
  if (!conv) return null;

  // Calculate unread count for the current user
  const unreadCount = conv.messages
    ? conv.messages.filter(m => m.senderId !== currentUserId && !m.isRead).length
    : 0;

  return {
    id: conv.id,
    type: conv.type,
    status: conv.status,
    lastMessage: conv.lastMessage,
    lastMessageAt: conv.lastMessageAt,
    createdAt: conv.createdAt,
    unreadCount,
    patient: conv.patient ? {
      id: conv.patient.id,
      name: conv.patient.name,
      avatarUrl: conv.patient.avatarUrl,
      phone: conv.patient.phone,
      email: conv.patient.email
    } : null,
    doctor: conv.doctor ? {
      id: conv.doctor.id,
      userId: conv.doctor.userId,
      name: conv.doctor.name,
      title: conv.doctor.title,
      avatar: conv.doctor.avatar,
      specialtyName: conv.doctor.specialtyName
    } : null,
    receptionist: conv.receptionist ? {
      id: conv.receptionist.id,
      name: conv.receptionist.name,
      avatarUrl: conv.receptionist.avatarUrl
    } : null
  };
}

function toMessageDto(msg) {
  if (!msg) return null;
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderRole: msg.senderRole,
    message: msg.message,
    messageType: msg.messageType,
    isRead: msg.isRead,
    createdAt: msg.createdAt
  };
}

function toConversationListDto(conversations, currentUserId) {
  if (!Array.isArray(conversations)) return [];
  return conversations.map(c => toConversationDto(c, currentUserId));
}

function toMessageListDto(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map(toMessageDto);
}

module.exports = {
  toConversationDto,
  toMessageDto,
  toConversationListDto,
  toMessageListDto,
};

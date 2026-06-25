import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle,
  X,
  Camera,
  Send,
  Headphones,
  Stethoscope,
  Hospital,
} from 'lucide-react';
import {
  CHAT_QUERY_KEYS,
  useConversations,
  useConversationMessages,
  useCreateConversation,
  useSendMessage,
} from '../../../features/chat/index.js';
import {
  AI_ASSISTANT_CONVERSATION_ID,
  useAIAssistantChat,
} from '../../../features/ai-assistant/index.js';
import socketService from '../../services/socket.service.js';
import axiosInstance from '../../services/axios.instance.js';

const PRIMARY_COLOR = '#49BCE2';
const SUPPORT_COLOR = '#F97316';
const DOCTOR_COLOR = '#7C3AED';
const EMPTY_CONVERSATIONS = [];

function renderConversationIcon(type, className) {
  if (type === 'SUPPORT') {
    return <Headphones className={className} />;
  }

  if (type === 'AI_ASSISTANT') {
    return <Hospital className={className} />;
  }

  return <Stethoscope className={className} />;
}

export default function ChatWidget() {
  const queryClient = useQueryClient();
  const aiChat = useAIAssistantChat();

  const authUser = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const role = useSelector((state) => state.auth.role);
  const isPatient = role === 'PATIENT';

  const [isOpen, setIsOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState(null);
  const [tempPartnerInfo, setTempPartnerInfo] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { data: convsResponse } = useConversations({
    enabled: isAuthenticated && isPatient,
  });
  const conversations = convsResponse?.data ?? EMPTY_CONVERSATIONS;

  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const isAIAssistantActive = activeConvId === AI_ASSISTANT_CONVERSATION_ID;
  const activeConversation = conversations.find((conversation) => conversation.id === activeConvId);

  const { data: messagesResponse } = useConversationMessages(activeConvId, {}, {
    enabled: !!activeConvId && !isAIAssistantActive && isAuthenticated && isPatient && isOpen,
  });
  const messages = messagesResponse?.data || [];

  const createConversationMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage({
    onSuccess: () => {
      setInputText('');
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeConvId) });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
    },
  });

  useEffect(() => {
    if (isAuthenticated && accessToken && isPatient) {
      socketService.connect(accessToken);
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, accessToken, isPatient]);

  useEffect(() => {
    if (activeConvId && !isAIAssistantActive && isAuthenticated && isPatient && isOpen) {
      socketService.joinConversation(activeConvId);
    }

    return () => {
      if (activeConvId && !isAIAssistantActive) {
        socketService.leaveConversation(activeConvId);
      }
    };
  }, [activeConvId, isAIAssistantActive, isAuthenticated, isPatient, isOpen]);

  useEffect(() => {
    if (!isAuthenticated || !isPatient) {
      return undefined;
    }

    const unsubscribeMessage = socketService.onMessageReceived((message) => {
      if (message.conversationId === activeConvId && isOpen && !isAIAssistantActive) {
        queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeConvId) });
      }
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
    });

    const unsubscribeNotification = socketService.onNotification((notification) => {
      if (notification.type === 'CHAT') {
        queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
        if (notification.conversationId === activeConvId && isOpen && !isAIAssistantActive) {
          queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeConvId) });
        }
      }
    });

    const unsubscribeTyping = socketService.onTypingStateChange(({ conversationId, userId, isTyping: nextTypingState }) => {
      if (
        conversationId === activeConvId
        && userId !== authUser?.id
        && isOpen
        && !isAIAssistantActive
      ) {
        setIsTyping(nextTypingState);
      }
    });

    const handleMessagesRead = () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
    };

    socketService.socket?.on('chat:messages-read', handleMessagesRead);

    return () => {
      unsubscribeMessage();
      unsubscribeNotification();
      unsubscribeTyping();
      socketService.socket?.off('chat:messages-read', handleMessagesRead);
    };
  }, [activeConvId, authUser?.id, isAIAssistantActive, isAuthenticated, isOpen, isPatient, queryClient]);

  useEffect(() => {
    const handleOpenDoctorChat = async (event) => {
      const { doctorId, doctorName } = event.detail;

      if (!(isAuthenticated && isPatient)) {
        setIsOpen(true);
        setActiveConvId(AI_ASSISTANT_CONVERSATION_ID);
        return;
      }

      setIsOpen(true);
      const currentConversations = conversationsRef.current;
      const existingConversation = currentConversations.find(
        (conversation) =>
          conversation.type === 'DOCTOR_CONSULTATION'
          && String(conversation.doctor?.id) === String(doctorId),
      );

      if (existingConversation) {
        setActiveConvId(existingConversation.id);
        return;
      }

      setTempPartnerInfo({ name: doctorName, role: 'Bác sĩ', type: 'DOCTOR_CONSULTATION' });

      try {
        const response = await createConversationMutation.mutateAsync({
          type: 'DOCTOR_CONSULTATION',
          doctorId: String(doctorId),
        });

        const conversationId = response?.data?.id || response?.id || null;
        if (conversationId) {
          setActiveConvId(conversationId);
          setTempPartnerInfo(null);
        }
      } catch {
        setTempPartnerInfo(null);
      }
    };

    window.addEventListener('open-doctor-chat', handleOpenDoctorChat);
    return () => window.removeEventListener('open-doctor-chat', handleOpenDoctorChat);
  }, [createConversationMutation, isAuthenticated, isPatient]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChat.messages.length, isOpen, messages.length, activeConvId]);

  const totalUnread = conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0);

  const handleInputChange = (event) => {
    setInputText(event.target.value);

    if (!activeConvId || isAIAssistantActive) {
      return;
    }

    socketService.emitTyping(activeConvId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitTyping(activeConvId, false);
    }, 2000);
  };

  const handleSendText = async (event) => {
    if (event) {
      event.preventDefault();
    }

    const message = inputText.trim();

    if (!message) {
      return;
    }

    if (isAIAssistantActive) {
      setInputText('');
      await aiChat.sendMessage(message);
      return;
    }

    if (!activeConvId) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socketService.emitTyping(activeConvId, false);

    sendMessageMutation.mutate({
      conversationId: activeConvId,
      message,
      messageType: 'TEXT',
    });
  };

  const handleCreateSupportChat = async () => {
    const existingConversation = conversations.find((conversation) => conversation.type === 'SUPPORT');
    if (existingConversation) {
      setActiveConvId(existingConversation.id);
      return;
    }

    try {
      const response = await createConversationMutation.mutateAsync({ type: 'SUPPORT' });
      setActiveConvId(response.data.id);
    } catch {
      return undefined;
    }

    return undefined;
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activeConvId || isAIAssistantActive) {
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'chat');

    setIsUploading(true);
    try {
      const response = await axiosInstance.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success && response.data?.data?.url) {
        sendMessageMutation.mutate({
          conversationId: activeConvId,
          message: response.data.data.url,
          messageType: 'FILE',
        });
      }
    } catch {
      alert('Không thể tải tệp lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getPartnerName = (conversation) => {
    if (!conversation) {
      return tempPartnerInfo?.name || 'Đang tải...';
    }
    if (conversation.type === 'SUPPORT') {
      return 'Lễ tân CarePlus';
    }
    return conversation.doctor?.name ? `${conversation.doctor.title} ${conversation.doctor.name}` : 'Bác sĩ tư vấn';
  };

  const getPartnerRole = (conversation) => {
    if (!conversation) {
      return tempPartnerInfo?.role || 'Bác sĩ';
    }
    return conversation.type === 'SUPPORT' ? 'Chăm sóc khách hàng' : 'Bác sĩ';
  };

  const openSupportConversation = async () => {
    const existingConversation = conversations.find((conversation) => conversation.type === 'SUPPORT');
    if (existingConversation) {
      setActiveConvId(existingConversation.id);
      return;
    }

    if (!(isAuthenticated && isPatient)) {
      return;
    }

    await handleCreateSupportChat();
  };

  const colorFor = (type) => {
    if (type === 'SUPPORT') {
      return SUPPORT_COLOR;
    }
    if (type === 'AI_ASSISTANT') {
      return PRIMARY_COLOR;
    }
    return DOCTOR_COLOR;
  };

  if (isAuthenticated && role && role !== 'PATIENT') {
    return null;
  }

  const activeType = isAIAssistantActive
    ? 'AI_ASSISTANT'
    : activeConversation?.type || tempPartnerInfo?.type || 'DOCTOR_CONSULTATION';
  const activeColor = colorFor(activeType);
  const isSendingDisabled = !inputText.trim()
    || isUploading
    || sendMessageMutation.isPending
    || aiChat.isLoading;

  return (
    <div className="fixed bottom-4 right-4 z-[999] flex flex-col items-end">
      <button
        onClick={() => {
          if (!isOpen && !activeConvId) {
            setActiveConvId(AI_ASSISTANT_CONVERSATION_ID);
          }
          setIsOpen((currentOpen) => !currentOpen);
        }}
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: isOpen ? '#1a7a9c' : PRIMARY_COLOR,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
          transition: 'transform 0.15s, background 0.15s',
          position: 'relative',
        }}
        className="hover:scale-108"
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5 text-white" />}
        {!isOpen && totalUnread > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#EF4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
            }}
          >
            {totalUnread}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: 88,
            bottom: 24,
            zIndex: 1000,
            width: 520,
            height: 460,
            display: 'flex',
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.16)',
            border: '1px solid #D9E2EC',
            overflow: 'hidden',
            animation: 'slideIn 0.2s ease-out',
          }}
          className="max-[600px]:!right-2 max-[600px]:!left-2 max-[600px]:!w-auto max-[600px]:!bottom-20 max-[600px]:!h-[70vh]"
        >
          <style>{'@keyframes slideIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}'}</style>

          <div
            style={{
              width: 162,
              borderRight: '1px solid #E5E7EB',
              display: 'flex',
              flexDirection: 'column',
              background: '#F6F7F9',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: '14px 10px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: '#A0AEC0',
                letterSpacing: 0.3,
                borderBottom: '1px solid #ECEFF3',
              }}
            >
              HỘP THOẠI
            </div>

            <div style={{ padding: '0' }}>
              <button
                onClick={() => setActiveConvId(AI_ASSISTANT_CONVERSATION_ID)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: isAIAssistantActive ? '#DDEAF4' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderLeft: isAIAssistantActive ? `2px solid ${PRIMARY_COLOR}` : '2px solid transparent',
                  textAlign: 'left',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: PRIMARY_COLOR,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {renderConversationIcon('AI_ASSISTANT', 'w-3.5 h-3.5 text-white')}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#4ADE80',
                      border: '1.5px solid #fff',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#334155',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    CarePlus AI
                  </div>
                  <div style={{ fontSize: 10, color: '#9AA4B2' }}>Trợ lý AI</div>
                </div>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {(() => {
                const supportConversation = conversations.find((conversation) => conversation.type === 'SUPPORT');
                const isSupportActive = !isAIAssistantActive && !!supportConversation && supportConversation.id === activeConvId;

                return (
                  <button
                    onClick={() => { void openSupportConversation(); }}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: isSupportActive ? '#FFF1E8' : 'transparent',
                      border: 'none',
                      cursor: isAuthenticated && isPatient ? 'pointer' : 'default',
                      borderLeft: isSupportActive ? `2px solid ${SUPPORT_COLOR}` : '2px solid transparent',
                      textAlign: 'left',
                    }}
                    disabled={!(isAuthenticated && isPatient) && !supportConversation}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: SUPPORT_COLOR,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {renderConversationIcon('SUPPORT', 'w-3.5 h-3.5 text-white')}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: -1,
                          right: -1,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#4ADE80',
                          border: '1.5px solid #fff',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#334155',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {supportConversation ? getPartnerName(supportConversation) : 'Lễ tân CarePlus'}
                      </div>
                      <div style={{ fontSize: 10, color: '#9AA4B2' }}>
                        {supportConversation ? getPartnerRole(supportConversation) : 'Chăm sóc khách hàng'}
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {(isAIAssistantActive || activeConvId) ? (
              <>
                <div
                  style={{
                    background: activeColor,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {renderConversationIcon(activeType, 'w-4 h-4 text-white')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {isAIAssistantActive ? 'CarePlus AI' : getPartnerName(activeConversation)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.85)',
                      }}
                    >
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80' }} />
                      {isAIAssistantActive
                        ? (aiChat.isLoading ? 'Đang trả lời...' : 'Đang online')
                        : (isTyping ? 'Bác sĩ đang nhập...' : 'Đang online')}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      background: 'rgba(255,255,255,0.16)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        color: '#FFFFFF',
                        fontSize: 16,
                        lineHeight: 1,
                        fontWeight: 700,
                        transform: 'translateY(-1px)',
                      }}
                    >
                      -
                    </span>
                  </button>
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '14px 16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    background: '#FFFFFF',
                  }}
                >
                  {(isAIAssistantActive ? aiChat.messages : messages).map((message) => {
                    const isOutgoing = isAIAssistantActive
                      ? message.role === 'user'
                      : message.senderId === authUser?.id;

                    return (
                      <div
                        key={message.id}
                        style={{
                          display: 'flex',
                          flexDirection: isOutgoing ? 'row-reverse' : 'row',
                          gap: 8,
                          alignItems: 'flex-end',
                        }}
                      >
                        {!isOutgoing && (
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: activeColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {renderConversationIcon(activeType, 'w-3.5 h-3.5 text-white')}
                          </div>
                        )}
                          <div style={{ maxWidth: '76%' }}>
                            <div
                              style={{
                                padding: '10px 14px',
                                borderRadius: isOutgoing ? '14px 14px 5px 14px' : '14px 14px 14px 5px',
                                background: isOutgoing ? activeColor : '#fff',
                                color: isOutgoing ? '#fff' : '#333',
                                fontSize: 12,
                                lineHeight: 1.5,
                                border: isOutgoing ? 'none' : '1px solid #D7DCE2',
                                boxShadow: isOutgoing ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.08)',
                              }}
                            >
                            {!isAIAssistantActive && message.messageType === 'FILE' ? (
                              <a href={message.message} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={message.message} alt="Ảnh đính kèm" className="max-w-full rounded-lg" />
                              </a>
                            ) : (
                              <p className="break-words whitespace-pre-wrap">
                                {isAIAssistantActive ? message.content : message.message}
                              </p>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: '#A3A3A3',
                              marginTop: 4,
                              textAlign: isOutgoing ? 'right' : 'left',
                            }}
                          >
                            {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderTop: '1px solid #ECEFF3',
                    display: 'flex',
                    gap: 7,
                    alignItems: 'center',
                    background: '#fff',
                    flexShrink: 0,
                  }}
                >
                  <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSendText();
                      }
                    }}
                    placeholder={isAIAssistantActive
                      ? (aiChat.isLoading ? 'CarePlus AI đang trả lời...' : 'Nhập câu hỏi về CarePlus...')
                      : (isUploading ? 'Đang tải hình ảnh...' : 'Nhập tin nhắn...')}
                    rows={1}
                    disabled={isAIAssistantActive ? aiChat.isLoading : isUploading}
                    style={{
                      flex: 1,
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      padding: '7px 9px',
                      fontSize: 13,
                      color: '#333',
                      outline: 'none',
                      resize: 'none',
                      lineHeight: 1.4,
                      maxHeight: 80,
                      overflowY: 'auto',
                    }}
                  />

                  {!isAIAssistantActive && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                      />

                      <button
                        type="button"
                        onClick={handleFileUploadClick}
                        disabled={isUploading}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          border: 'none',
                          cursor: 'pointer',
                          background: '#F5F5F5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Camera className="w-4 h-4 text-gray-600" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={(event) => {
                      void handleSendText(event);
                    }}
                    disabled={isSendingDisabled}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: 'none',
                      cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                      background: inputText.trim() ? activeColor : '#E5E5E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.15s',
                    }}
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                <div className="w-12 h-12 bg-gray-200/50 rounded-full flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">Vui lòng chọn hội thoại để bắt đầu nhắn tin.</p>
                {!isAuthenticated && (
                  <Link
                    to={`/dang-nhap?redirect=${window.location.pathname}`}
                    className="mt-4 px-4 py-2 bg-[#49BCE2] hover:bg-[#3ca4c5] text-white rounded-lg font-medium transition text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

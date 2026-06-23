import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle, X, Hospital, Minus, Camera, Send, Headphones, Stethoscope } from 'lucide-react';
import { useConversations, useConversationMessages, useCreateConversation, useSendMessage, CHAT_QUERY_KEYS } from '../../../features/chat/index.js';
import socketService from '../../services/socket.service.js';
import axiosInstance from '../../services/axios.instance.js';

const PRIMARY_COLOR = '#49BCE2';
const SUPPORT_COLOR = '#F97316';
const DOCTOR_COLOR = '#7C3AED';

export default function ChatWidget() {
  const queryClient = useQueryClient();

  // Auth state
  const authUser = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const role = useSelector((state) => state.auth.role);
  const isPatient = role === 'PATIENT';

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState(null);
  const [tempPartnerInfo, setTempPartnerInfo] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch conversations (only if authenticated and patient)
  const { data: convsResponse } = useConversations({
    enabled: isAuthenticated && isPatient
  });
  const conversations = convsResponse?.data || [];

  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Active conversation details
  const activeConversation = conversations.find(c => c.id === activeConvId);

  // 2. Fetch messages in active conversation
  const { data: messagesResponse } = useConversationMessages(activeConvId, {}, {
    enabled: !!activeConvId && isAuthenticated && isPatient
  });
  const messages = messagesResponse?.data || [];

  // 3. Mutations
  const createConversationMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage({
    onSuccess: () => {
      setInputText('');
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeConvId) });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
    }
  });

  // Connect socket
  useEffect(() => {
    if (isAuthenticated && accessToken && isPatient) {
      socketService.connect(accessToken);
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, accessToken, isPatient]);

  // Join/leave conversation room
  useEffect(() => {
    if (activeConvId && isAuthenticated && isPatient) {
      socketService.joinConversation(activeConvId);
    }
    return () => {
      if (activeConvId) {
        socketService.leaveConversation(activeConvId);
      }
    };
  }, [activeConvId, isAuthenticated, isPatient]);

  // Listen for socket events
  useEffect(() => {
    if (!isAuthenticated || !isPatient) return;

    const unsubscribeMessage = socketService.onMessageReceived((msg) => {
      if (msg.conversationId === activeConvId) {
        queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeConvId) });
      }
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
    });

    const unsubscribeNotification = socketService.onNotification((notif) => {
      if (notif.type === 'CHAT') {
        queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
        if (notif.conversationId === activeConvId) {
          queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeConvId) });
        }
      }
    });

    const unsubscribeTyping = socketService.onTypingStateChange(({ conversationId, userId, isTyping }) => {
      if (conversationId === activeConvId && userId !== authUser?.id) {
        setIsTyping(isTyping);
      }
    });

    const unsubscribeMessagesRead = () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
    };
    socketService.socket?.on('chat:messages-read', unsubscribeMessagesRead);

    return () => {
      unsubscribeMessage();
      unsubscribeNotification();
      unsubscribeTyping();
      socketService.socket?.off('chat:messages-read', unsubscribeMessagesRead);
    };
  }, [activeConvId, isAuthenticated, isPatient, authUser?.id, queryClient]);

  // Handle custom event to start/open chat with doctor
  useEffect(() => {
    const handleOpenDoctorChat = async (e) => {
      const { doctorId, doctorName } = e.detail;
      console.log('[ChatWidget] Received open-doctor-chat event:', { doctorId, doctorName });
      setIsOpen(true);
      setTempPartnerInfo({ name: doctorName, role: 'Bác sĩ', type: 'DOCTOR_CONSULTATION' });

      const currentConvs = conversationsRef.current || [];
      console.log('[ChatWidget] Current conversations in Ref:', currentConvs);

      const existing = currentConvs.find(
        (c) => c.type === 'DOCTOR_CONSULTATION' && String(c.doctor?.id) === String(doctorId)
      );

      if (existing) {
        console.log('[ChatWidget] Found existing doctor conversation room:', existing.id);
        setActiveConvId(existing.id);
      } else {
        console.log('[ChatWidget] Creating new doctor conversation room for doctorId:', doctorId);
        try {
          const res = await createConversationMutation.mutateAsync({
            type: 'DOCTOR_CONSULTATION',
            doctorId: String(doctorId)
          });
          console.log('[ChatWidget] Created conversation success response:', res);
          if (res?.data?.id) {
            setActiveConvId(res.data.id);
          } else if (res?.id) {
            setActiveConvId(res.id);
          } else {
            console.error('[ChatWidget] Response missing ID:', res);
          }
          queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
        } catch (err) {
          console.error('[ChatWidget] Failed to create doctor consultation chat:', err);
        }
      }
    };

    window.addEventListener('open-doctor-chat', handleOpenDoctorChat);
    return () => window.removeEventListener('open-doctor-chat', handleOpenDoctorChat);
  }, [createConversationMutation, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeConvId, isOpen]);

  // Set default active conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // Calculate unread count
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!activeConvId) return;

    socketService.emitTyping(activeConvId, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitTyping(activeConvId, false);
    }, 2000);
  };

  const handleSendText = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.emitTyping(activeConvId, false);

    sendMessageMutation.mutate({
      conversationId: activeConvId,
      message: inputText.trim(),
      messageType: 'TEXT'
    });
  };

  const handleCreateSupportChat = async () => {
    const existing = conversations.find((c) => c.type === 'SUPPORT');
    if (existing) {
      setActiveConvId(existing.id);
      return;
    }

    try {
      const res = await createConversationMutation.mutateAsync({ type: 'SUPPORT' });
      setActiveConvId(res.data.id);
    } catch (err) {
      console.error('Failed to create support chat:', err);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'chat');

    setIsUploading(true);
    try {
      const res = await axiosInstance.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success && res.data?.data?.url) {
        sendMessageMutation.mutate({
          conversationId: activeConvId,
          message: res.data.data.url,
          messageType: 'FILE'
        });
      }
    } catch (error) {
      alert('Không thể tải tệp lên. Vui lòng thử lại.');
      console.error('[ChatWidget] Upload file error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getPartnerName = (conv) => {
    if (!conv) return tempPartnerInfo?.name || 'Đang tải...';
    if (conv.type === 'SUPPORT') {
      return conv.receptionist?.name || 'Lễ tân hỗ trợ';
    }
    return conv.doctor?.name ? `${conv.doctor.title} ${conv.doctor.name}` : 'Bác sĩ tư vấn';
  };

  const getPartnerRole = (conv) => {
    if (!conv) return tempPartnerInfo?.role || 'Bác sĩ';
    return conv.type === 'SUPPORT' ? 'Chăm sóc khách hàng' : 'Bác sĩ';
  };

  const getPartnerInitials = (conv) => {
    const name = getPartnerName(conv);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const colorFor = (type) => type === 'SUPPORT' ? SUPPORT_COLOR : DOCTOR_COLOR;
  const IconFor = (type) => type === 'SUPPORT' ? Headphones : Stethoscope;

  return (
    <div className="fixed bottom-4 right-4 z-[999] flex flex-col items-end">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          position: 'relative'
        }}
        className="hover:scale-108"
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5 text-white" />}
        {!isOpen && totalUnread > 0 && (
          <div style={{
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
            border: '2px solid #fff'
          }}>
            {totalUnread}
          </div>
        )}
      </button>

      {/* Chat Popup Panel using SupportWidget two-column UI */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: 88,
            bottom: 24,
            zIndex: 1000,
            width: 520,
            height: 500,
            display: 'flex',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: '1px solid #E5E5E5',
            overflow: 'hidden',
            animation: 'slideIn 0.2s ease-out',
          }}
          className="max-[600px]:!right-2 max-[600px]:!left-2 max-[600px]:!w-auto max-[600px]:!bottom-20 max-[600px]:!h-[70vh]"
        >
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}`}</style>

          {!isAuthenticated || !isPatient ? (
            /* Guest / Non-Patient Login State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
              <div className="w-16 h-16 bg-[#49BCE2]/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-[#49BCE2]" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Tư vấn trực tuyến</h4>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Vui lòng đăng nhập tài khoản bệnh nhân để trò chuyện trực tiếp với bác sĩ hoặc bộ phận CSKH của CarePlus.
              </p>
              <Link
                to={`/dang-nhap?redirect=${window.location.pathname}`}
                className="px-6 py-2.5 bg-[#49BCE2] hover:bg-[#3ca4c5] text-white rounded-lg font-medium transition text-sm"
                onClick={() => setIsOpen(false)}
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            /* Logged In Two-Column UI */
            <>
              {/* Left Column: Conversation Sidebar list */}
              <div style={{ width: 170, borderRight: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', background: '#FAFAFA', flexShrink: 0 }}>
                <div style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 0.5, borderBottom: '1px solid #F0F0F0' }}>HỘI THOẠI</div>
                
                {/* CSKH Creation Shortcut */}
                <button
                  onClick={handleCreateSupportChat}
                  className="mx-2 my-2 py-1.5 px-2 bg-gradient-to-r from-[#49BCE2] to-[#3ca4c5] text-white text-[11px] font-bold rounded-lg shadow-sm hover:from-[#3ca4c5] hover:to-[#2d95b0] transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Headphones className="w-3 h-3" />
                  <span>Chat với Lễ tân</span>
                </button>

                {/* Conversation Items List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {conversations.map((c) => {
                    const Ic = IconFor(c.type);
                    const col = colorFor(c.type);
                    const isActive = c.id === activeConvId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setActiveConvId(c.id); }}
                        style={{
                          width: '100%',
                          padding: '10px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: isActive ? '#EBF7FD' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderLeft: isActive ? `3px solid ${col}` : '3px solid transparent',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: col, display: 'flex', alignItems: 'center', justifycontent: 'center', display: 'flex', justifyContent: 'center' }}>
                            <Ic className="w-3.5 h-3.5 text-white m-auto" />
                          </div>
                          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', border: '1.5px solid #fff' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getPartnerName(c)}
                          </div>
                          <div style={{ fontSize: 9, color: '#aaa' }}>{getPartnerRole(c)}</div>
                        </div>
                        {c.unreadCount > 0 && (
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {c.unreadCount}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Active Conversation Messages & Input */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {activeConvId ? (
                  (() => {
                    const activeType = activeConversation?.type || tempPartnerInfo?.type || 'DOCTOR_CONSULTATION';
                    const activeColor = colorFor(activeType);
                    const ActiveIcon = IconFor(activeType);
                    return (
                      <>
                        {/* Active Header */}
                        <div style={{ background: activeColor, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ActiveIcon className="w-4 h-4 text-white" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{getPartnerName(activeConversation)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80' }} />
                              {isTyping ? 'Bác sĩ đang nhập...' : 'Đang online'}
                            </div>
                          </div>
                          <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Minus className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>

                        {/* Messages Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 10, background: '#F9FAFB' }}>
                          {messages.map((message) => {
                            const isOutgoing = message.senderId === authUser.id;
                            return (
                              <div
                                key={message.id}
                                style={{
                                  display: 'flex',
                                  flexDirection: isOutgoing ? 'row-reverse' : 'row',
                                  gap: 7,
                                  alignItems: 'flex-end'
                                }}
                              >
                                {!isOutgoing && (
                                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: activeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ActiveIcon className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                                <div style={{ maxWidth: '72%' }}>
                                  <div
                                    style={{
                                      padding: '8px 11px',
                                      borderRadius: isOutgoing ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                      background: isOutgoing ? activeColor : '#fff',
                                      color: isOutgoing ? '#fff' : '#333',
                                      fontSize: 13,
                                      lineHeight: 1.5,
                                      border: isOutgoing ? 'none' : '1px solid #E5E5E5',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                    }}
                                  >
                                    {message.messageType === 'FILE' ? (
                                      <a href={message.message} target="_blank" rel="noopener noreferrer" className="block">
                                        <img src={message.message} alt="Ảnh đính kèm" className="max-w-full rounded-lg" />
                                      </a>
                                    ) : (
                                      <p className="break-words">{message.message}</p>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, textAlign: isOutgoing ? 'right' : 'left' }}>
                                    {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input Bar */}
                        <div style={{ padding: '8px 10px', borderTop: '1px solid #E5E5E5', display: 'flex', gap: 7, alignItems: 'center', background: '#fff', flexShrink: 0 }}>
                          <textarea
                            value={inputText}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendText();
                              }
                            }}
                            placeholder={isUploading ? 'Đang tải hình ảnh...' : 'Nhập tin nhắn...'}
                            rows={1}
                            disabled={isUploading}
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
                              overflowY: 'auto'
                            }}
                          />

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
                            style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >
                            <Camera className="w-4 h-4 text-gray-600" />
                          </button>

                          <button
                            onClick={handleSendText}
                            disabled={!inputText.trim() || isUploading || sendMessageMutation.isPending}
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
                              transition: 'background 0.15s'
                            }}
                          >
                            <Send className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  /* Empty state when logged in but no active convo is selected */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                    <div className="w-12 h-12 bg-gray-200/50 rounded-full flex items-center justify-center mb-3">
                      <MessageCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">Vui lòng chọn hoặc tạo cuộc hội thoại bên trái để bắt đầu nhắn tin.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

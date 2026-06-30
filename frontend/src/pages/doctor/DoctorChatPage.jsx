import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useConversations, useConversationMessages, useSendMessage, CHAT_QUERY_KEYS } from '../../features/chat/index.js';
import socketService from '../../shared/services/socket.service.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { Search, Send, MessageSquare, AlertCircle, ArrowLeft } from 'lucide-react';

export default function DoctorChatPage() {
  const queryClient = useQueryClient();
  
  // Auth state
  const authUser = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const currentUserId = authUser?.id;

  // Local state
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [search, setSearch] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch conversations
  const { data: convsResponse, isLoading: isLoadingConvs, error: convsError } = useConversations();
  const conversations = convsResponse?.data || [];

  // Find active conversation details
  const activeConversation = conversations.find((item) => item.id === activeConversationId);

  // 2. Fetch messages in active conversation
  const { data: messagesResponse, isLoading: isLoadingMessages } = useConversationMessages(activeConversationId);
  const messages = messagesResponse?.data || [];

  // 3. Send message mutation
  const sendMessageMutation = useSendMessage({
    onSuccess: () => {
      setDraftMessage('');
      // Invalidate query to trigger fetch
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeConversationId) });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
    }
  });

  // Socket connection lifecycle
  useEffect(() => {
    if (accessToken) {
      socketService.connect(accessToken);
    }
  }, [accessToken]);

  // Join/leave conversation room
  useEffect(() => {
    if (activeConversationId) {
      socketService.joinConversation(activeConversationId);
    }
    return () => {
      if (activeConversationId) {
        socketService.leaveConversation(activeConversationId);
      }
    };
  }, [activeConversationId]);

  // Listen to socket events
  useEffect(() => {
    const unsubscribeMessage = socketService.onMessageReceived((msg) => {
      if (msg.conversationId === activeConversationId) {
        queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeConversationId) });
      }
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
    });

    const unsubscribeNotification = socketService.onNotification((notif) => {
      if (notif.type === 'CHAT') {
        queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
        if (notif.conversationId === activeConversationId) {
          queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeConversationId) });
        }
      }
    });

    const unsubscribeTyping = socketService.onTypingStateChange(({ conversationId, userId, isTyping }) => {
      if (conversationId === activeConversationId && userId !== currentUserId) {
        setIsRecipientTyping(isTyping);
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
  }, [activeConversationId, currentUserId, queryClient]);

  // Set default active conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeConversationId]);

  // Filter conversations by patient's name
  const filteredConversations = conversations.filter((item) => {
    const name = item.patient?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const unreadCount = conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);

  const selectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    setIsRecipientTyping(false);
  };

  const handleInputChange = (event) => {
    setDraftMessage(event.target.value);
    if (!activeConversationId) return;

    socketService.emitTyping(activeConversationId, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitTyping(activeConversationId, false);
    }, 2000);
  };

  const sendMessage = (event) => {
    event.preventDefault();
    if (!draftMessage.trim() || !activeConversationId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.emitTyping(activeConversationId, false);

    sendMessageMutation.mutate({
      conversationId: activeConversationId,
      message: draftMessage.trim(),
      messageType: 'TEXT'
    });
  };

  const getInitials = (name) => {
    if (!name) return 'BN';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-100px)]">
      {/* Title block */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Tư vấn trực tuyến</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {unreadCount > 0 ? `${unreadCount} tin nhắn chưa đọc` : 'Không có tin nhắn mới'}
        </p>
      </div>

      {convsError && (
        <div className="mb-3">
          <StateBlock variant="error" title="Không thể tải danh sách hội thoại" description={convsError.message} />
        </div>
      )}

      {isLoadingConvs ? (
        <div className="flex-1 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-xs">
          <LoadingBlock label="Đang tải tin nhắn..." />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-xs p-6 text-center">
          <StateBlock title="Chưa có cuộc trò chuyện nào" description="Lịch sử tin nhắn tư vấn với bệnh nhân sẽ hiển thị tại đây." />
        </div>
      ) : (
        <div className="flex-1 flex bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden min-h-0">
          {/* Left panel: Conversation List */}
          <div className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-gray-100 flex-col flex-shrink-0 bg-white`}>
            {/* Search */}
            <div className="p-3 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm bệnh nhân..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-gray-50 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">Không tìm thấy bệnh nhân</div>
              ) : (
                filteredConversations.map((conv) => {
                  const partnerName = conv.patient?.name || 'Bệnh nhân';
                  const partnerInitials = getInitials(partnerName);
                  const isActive = conv.id === activeConversationId;
                  
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`w-full flex items-center gap-3 p-3.5 text-left transition border-l-3 cursor-pointer ${
                        isActive 
                          ? 'bg-blue-50/50 border-l-[#49BCE2]' 
                          : 'border-l-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#49BCE2] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {partnerInitials}
                        </div>
                        {conv.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`text-sm overflow-hidden text-overflow-ellipsis white-space-nowrap ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                            {partnerName}
                          </span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
                            {conv.lastMessage}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Active Chat room */}
          <div className={`${activeConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 bg-gray-50/50`}>
            {activeConversation ? (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3 shadow-xs">
                  <button 
                    onClick={() => setActiveConversationId(null)} 
                    className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#49BCE2] flex items-center justify-center text-white font-bold text-sm">
                      {getInitials(activeConversation.patient?.name)}
                    </div>
                  </div>
                  
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 truncate">{activeConversation.patient?.name}</h3>
                    <p className="text-[10px] font-semibold text-emerald-500">
                      {isRecipientTyping ? 'Đang gõ tin nhắn...' : 'Đang trực tuyến'}
                    </p>
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                  {isLoadingMessages ? (
                    <LoadingBlock label="Đang tải tin nhắn cũ..." />
                  ) : (
                    messages.map((message) => {
                      const isOutgoing = message.senderId === currentUserId;
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2.5 max-w-[80%] ${isOutgoing ? 'self-end flex-row-reverse' : 'self-start'}`}
                        >
                          {!isOutgoing && (
                            <div className="w-7 h-7 rounded-full bg-[#49BCE2] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm self-end">
                              {getInitials(activeConversation.patient?.name)}
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5">
                            {message.messageType === 'FILE' ? (
                              <div className="p-1 rounded-xl bg-white border border-gray-100 shadow-xs max-w-xs overflow-hidden">
                                <a href={message.message} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95 transition">
                                  <img src={message.message} alt="File đính kèm" className="max-w-[200px] sm:max-w-[240px] rounded-lg" />
                                </a>
                              </div>
                            ) : (
                              <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                                isOutgoing 
                                  ? 'bg-[#49BCE2] text-white rounded-br-none' 
                                  : 'bg-white border border-gray-200/80 text-gray-800 rounded-bl-none'
                              }`}>
                                {message.message}
                              </div>
                            )}
                            <span className={`text-[9px] text-gray-400 mt-1 ${isOutgoing ? 'text-right' : 'text-left'}`}>
                              {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input Bar */}
                <form className="p-3 border-t border-gray-150 bg-white flex gap-2.5 items-end flex-shrink-0" onSubmit={sendMessage}>
                  <div className="flex-1 bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#49BCE2] focus-within:border-transparent focus-within:bg-white transition flex">
                    <textarea
                      placeholder="Nhập tin nhắn..."
                      value={draftMessage}
                      onChange={handleInputChange}
                      rows={1}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage(event);
                        }
                      }}
                      className="w-full text-sm bg-transparent outline-none resize-none max-h-24 min-h-[20px] text-gray-800 leading-relaxed font-sans placeholder-gray-400"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!draftMessage.trim() || sendMessageMutation.isPending} 
                    className="w-9 h-9 rounded-full bg-[#49BCE2] hover:bg-[#3ca4c5] disabled:bg-gray-100 disabled:text-gray-400 text-white flex items-center justify-center transition shadow-xs cursor-pointer flex-shrink-0"
                    aria-label="Gửi tin nhắn"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
                <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Tư vấn trực tuyến</h4>
                <p className="text-xs text-gray-400 text-center">Chọn một bệnh nhân ở thanh bên trái để bắt đầu chat tư vấn.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

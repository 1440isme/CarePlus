import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useConversations, useConversationMessages, useSendMessage, CHAT_QUERY_KEYS } from '../../features/chat/index.js';
import socketService from '../../shared/services/socket.service.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { Search, Send, MessageSquare, ArrowLeft } from 'lucide-react';

export default function ReceptionistChatPage() {
  const queryClient = useQueryClient();

  // Auth state
  const authUser = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const currentUserId = authUser?.id;

  // Local state
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch support conversations
  const { data: convsResponse, isLoading: isLoadingConvs, error: convsError } = useConversations();
  const conversations = convsResponse?.data || [];

  // Active chat
  const activeChat = conversations.find(c => c.id === activeChatId);

  // 2. Fetch messages in active conversation
  const { data: messagesResponse, isLoading: isLoadingMessages } = useConversationMessages(activeChatId);
  const messages = messagesResponse?.data || [];

  // 3. Send message mutation
  const sendMessageMutation = useSendMessage({
    onSuccess: () => {
      setInputMessage('');
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeChatId) });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
    }
  });

  // Connect socket
  useEffect(() => {
    if (accessToken) {
      socketService.connect(accessToken);
    }
  }, [accessToken]);

  // Join/leave conversation room
  useEffect(() => {
    if (activeChatId) {
      socketService.joinConversation(activeChatId);
    }
    return () => {
      if (activeChatId) {
        socketService.leaveConversation(activeChatId);
      }
    };
  }, [activeChatId]);

  // Listen to socket events
  useEffect(() => {
    const unsubscribeMessage = socketService.onMessageReceived((msg) => {
      if (msg.conversationId === activeChatId) {
        queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeChatId) });
      }
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
    });

    const unsubscribeNotification = socketService.onNotification((notif) => {
      if (notif.type === 'CHAT') {
        queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
        if (notif.conversationId === activeChatId) {
          queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(activeChatId) });
        }
      }
    });

    const unsubscribeTyping = socketService.onTypingStateChange(({ conversationId, userId, isTyping }) => {
      if (conversationId === activeChatId && userId !== currentUserId) {
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
  }, [activeChatId, currentUserId, queryClient]);

  // Set default active conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !activeChatId) {
      setActiveChatId(conversations[0].id);
    }
  }, [conversations, activeChatId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChatId]);

  // Filter conversations
  const filteredChats = conversations.filter(chat => {
    const name = chat.patient?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const unreadTotal = conversations.reduce((total, c) => total + (c.unreadCount || 0), 0);

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setIsRecipientTyping(false);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (!activeChatId) return;

    socketService.emitTyping(activeChatId, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitTyping(activeChatId, false);
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.emitTyping(activeChatId, false);

    sendMessageMutation.mutate({
      conversationId: activeChatId,
      message: inputMessage.trim(),
      messageType: 'TEXT'
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage(e);
    }
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
        <h1 className="text-xl font-bold text-gray-800">Hỗ trợ &amp; Tư vấn</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {unreadTotal > 0 ? `${unreadTotal} tin nhắn chưa đọc` : 'Không có tin nhắn mới'}
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
          <StateBlock title="Chưa có cuộc trò chuyện nào" description="Tin nhắn hỗ trợ từ các bệnh nhân sẽ hiển thị tại đây." />
        </div>
      ) : (
        <div className="flex-1 flex bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden min-h-0">
          {/* Left panel: Conversation List (280px) */}
          <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-70 border-r border-gray-100 flex-col flex-shrink-0 bg-white`}>
            {/* Search */}
            <div className="p-3 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm cuộc trò chuyện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-gray-50 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {filteredChats.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">Không tìm thấy cuộc trò chuyện</div>
              ) : (
                filteredChats.map((chat) => {
                  const partnerName = chat.patient?.name || 'Bệnh nhân';
                  const partnerInitials = getInitials(partnerName);
                  const isActive = chat.id === activeChatId;

                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      className={`w-full flex items-center gap-3 p-3.5 text-left transition border-l-3 cursor-pointer ${
                        isActive
                          ? 'bg-blue-50/50 border-l-[#49BCE2]'
                          : 'border-l-transparent hover:bg-gray-50'
                      }`}
                    >
                      {/* Avatar with online dot */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#49BCE2] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {partnerInitials}
                        </div>
                        {chat.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                        )}
                      </div>

                      {/* Name + time + preview + badge */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                            {partnerName}
                          </span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                            {chat.lastMessageAt
                              ? new Date(chat.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className={`text-xs truncate flex-1 ${chat.unreadCount > 0 ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
                            {chat.lastMessage}
                          </span>
                          {chat.unreadCount > 0 && (
                            <span className="min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                              {chat.unreadCount}
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
          <div className={`${activeChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 bg-gray-50/50`}>
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3 shadow-xs">
                  <button
                    onClick={() => setActiveChatId(null)}
                    className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#49BCE2] flex items-center justify-center text-white font-bold text-sm">
                      {getInitials(activeChat.patient?.name)}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 truncate">{activeChat.patient?.name}</h3>
                    <p className="text-[10px] font-semibold text-emerald-500">
                      {isRecipientTyping ? 'Đang gõ tin nhắn...' : 'Đang trực tuyến'}
                    </p>
                  </div>
                </div>

                {/* Messages scroll area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                  {isLoadingMessages ? (
                    <LoadingBlock label="Đang tải tin nhắn cũ..." />
                  ) : (
                    messages.map((msg) => {
                      const isOutgoing = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 max-w-[80%] ${isOutgoing ? 'self-end flex-row-reverse' : 'self-start'}`}
                        >
                          {!isOutgoing && (
                            <div className="w-7 h-7 rounded-full bg-[#49BCE2] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm self-end">
                              {getInitials(activeChat.patient?.name)}
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5">
                            {msg.messageType === 'FILE' ? (
                              <div className="p-1 rounded-xl bg-white border border-gray-100 shadow-xs max-w-xs overflow-hidden">
                                <a href={msg.message} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95 transition">
                                  <img src={msg.message} alt="File đính kèm" className="max-w-[200px] sm:max-w-[240px] rounded-lg" />
                                </a>
                              </div>
                            ) : (
                              <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                                isOutgoing
                                  ? 'bg-[#49BCE2] text-white rounded-br-none'
                                  : 'bg-white border border-gray-200/80 text-gray-800 rounded-bl-none'
                              }`}>
                                {msg.message}
                              </div>
                            )}
                            <span className={`text-[9px] text-gray-400 mt-1 ${isOutgoing ? 'text-right' : 'text-left'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <form className="p-3 border-t border-gray-150 bg-white flex gap-2.5 items-end flex-shrink-0" onSubmit={handleSendMessage}>
                  <div className="flex-1 bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#49BCE2] focus-within:border-transparent focus-within:bg-white transition flex">
                    <textarea
                      placeholder="Nhập tin nhắn... (Enter để gửi)"
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className="w-full text-sm bg-transparent outline-none resize-none max-h-24 min-h-[20px] text-gray-800 leading-relaxed font-sans placeholder-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending}
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
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Hỗ trợ &amp; Tư vấn</h4>
                <p className="text-xs text-gray-400 text-center">Chọn một cuộc trò chuyện để bắt đầu hỗ trợ bệnh nhân.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

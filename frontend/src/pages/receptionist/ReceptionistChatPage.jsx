import { useState, useEffect, useRef } from 'react';
import './receptionist.css';

const INITIAL_CHATS = [
  {
    id: 'chat-1',
    name: 'Nguyễn Văn A',
    initials: 'NV',
    online: true,
    lastMessage: 'Tôi muốn hỏi về lịch hẹn ngày mai...',
    time: '09:32',
    unreadCount: 0,
    messages: [
      { id: 'm1', sender: 'patient', text: 'Xin chào, tôi muốn hỏi về lịch hẹn của mình.', time: '15/6/2026 09:30' },
      { id: 'm2', sender: 'receptionist', text: 'Lịch hẹn của bạn vào 09:00 ngày mai tại phòng số 3.', time: '15/6/2026 09:31', status: 'Đã xem' },
      { id: 'm3', sender: 'patient', text: 'Tôi muốn hỏi về lịch hẹn ngày mai...', time: '15/6/2026 09:32' },
    ]
  },
  {
    id: 'chat-2',
    name: 'Phạm Thị B',
    initials: 'PT',
    online: false,
    lastMessage: 'Cảm ơn bạn rất nhiều!',
    time: 'Hôm qua',
    unreadCount: 0,
    messages: [
      { id: 'm4', sender: 'receptionist', text: 'Chúng tôi đã dời lịch khám cho bạn sang thứ Hai tuần sau rồi ạ.', time: 'Hôm qua 14:15', status: 'Đã xem' },
      { id: 'm5', sender: 'patient', text: 'Cảm ơn bạn rất nhiều!', time: 'Hôm qua 14:16' }
    ]
  },
  {
    id: 'chat-3',
    name: 'Trần Lê Quốc Đại',
    initials: 'TL',
    online: true,
    lastMessage: 'Bác sĩ ơi, tôi bị đau ngực...',
    time: '08:15',
    unreadCount: 1,
    messages: [
      { id: 'm6', sender: 'patient', text: 'Bác sĩ ơi, tôi bị đau ngực và khó thở nhẹ từ sáng nay.', time: 'Hôm nay 08:15' }
    ]
  }
];

const AUTO_REPLIES = {
  'chat-1': 'Cảm ơn lễ tân đã hướng dẫn, tôi sẽ đến đúng giờ khám ạ!',
  'chat-2': 'Vâng, tôi đã nhận được lịch mới rồi. Cảm ơn nhé!',
  'chat-3': 'Dạ vâng ạ, tôi sẽ ngồi nghỉ ngơi tại quầy và chờ gọi tên ạ.'
};

export default function ReceptionistChatPage() {
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState('chat-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  
  const messagesEndRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages?.length, activeChatId]);

  // Mark unread as read when clicking a chat
  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChat) return;

    const newMessageText = inputMessage.trim();
    setInputMessage('');

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const timestamp = `${dateStr} ${timeStr}`;

    const newMsgObj = {
      id: `msg-${Date.now()}`,
      sender: 'receptionist',
      text: newMessageText,
      time: timestamp,
      status: 'Đang gửi...'
    };

    // 1. Add receptionist message
    setChats(prevChats => 
      prevChats.map(c => {
        if (c.id === activeChatId) {
          const updatedMessages = [...c.messages, newMsgObj];
          return {
            ...c,
            lastMessage: newMessageText,
            time: timeStr,
            messages: updatedMessages
          };
        }
        return c;
      })
    );

    // Simulate sent status transition after 300ms
    setTimeout(() => {
      setChats(prevChats =>
        prevChats.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: c.messages.map(m => 
                m.id === newMsgObj.id ? { ...m, status: 'Đã xem' } : m
              )
            };
          }
          return c;
        })
      );
    }, 500);

    // 2. Trigger auto reply after 1.5 seconds
    const replyText = AUTO_REPLIES[activeChatId] || 'Cảm ơn lễ tân!';
    setTimeout(() => {
      const replyTime = new Date();
      const replyTimeStr = `${replyTime.getHours().toString().padStart(2, '0')}:${replyTime.getMinutes().toString().padStart(2, '0')}`;
      const replyTimestamp = `${replyTime.getDate()}/${replyTime.getMonth() + 1}/${replyTime.getFullYear()} ${replyTimeStr}`;

      const replyMsgObj = {
        id: `reply-${Date.now()}`,
        sender: 'patient',
        text: replyText,
        time: replyTimestamp
      };

      setChats(prevChats =>
        prevChats.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              lastMessage: replyText,
              time: replyTimeStr,
              messages: [...c.messages, replyMsgObj]
            };
          } else if (c.id !== activeChatId && c.id === 'chat-3') {
            // just to make sure we don't mess up other chats unless we specifically want to
            return c;
          }
          return c;
        })
      );
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage(e);
    }
  };

  // Filter chats by search query
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadTotal = chats.reduce((total, c) => total + c.unreadCount, 0);

  return (
    <div className="receptionist-page">
      <div className="chat-page-header">
        <h1>Tin nhắn bệnh nhân</h1>
        <p>{unreadTotal > 0 ? `${unreadTotal} tin nhắn chưa đọc` : 'Không có tin nhắn chưa đọc'}</p>
      </div>

      <div className="chat-main-container">
        {/* Left Column: Chat List */}
        <div className="chat-left-sidebar">
          <div className="chat-search-container">
            <div className="chat-search-input-shell">
              <svg className="chat-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="chat-search-input"
                placeholder="Tìm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="chat-list-scrollable">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  className={`chat-list-item ${chat.id === activeChatId ? 'active' : ''}`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="chat-item-avatar-wrapper">
                    <div className="chat-item-avatar">
                      {chat.initials}
                    </div>
                    {chat.online && <span className="chat-item-online-dot" />}
                  </div>

                  <div className="chat-item-meta">
                    <div className="chat-item-name-row">
                      <span className="chat-item-name">{chat.name}</span>
                      <span className="chat-item-time">{chat.time}</span>
                    </div>
                    <div className="chat-item-lastmsg-row">
                      <span className="chat-item-preview">{chat.lastMessage}</span>
                      {chat.unreadCount > 0 && (
                        <span className="chat-item-unread-badge">{chat.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#aaaaaa', fontSize: '0.85rem' }}>
                Không tìm thấy cuộc hội thoại
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="chat-right-panel">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="chat-panel-header">
                <div className="chat-header-avatar">
                  {activeChat.initials}
                </div>
                <div className="chat-header-info">
                  <h3 className="chat-header-name">{activeChat.name}</h3>
                  <p className="chat-header-status" style={{ color: activeChat.online ? '#4ADE80' : '#888888' }}>
                    {activeChat.online ? 'Đang online' : 'Ngoại tuyến'}
                  </p>
                </div>
              </div>

              {/* Messages area */}
              <div className="chat-messages-scroll">
                {activeChat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message-row ${msg.sender === 'receptionist' ? 'outgoing' : 'incoming'}`}
                  >
                    {msg.sender === 'patient' && (
                      <div className="chat-message-avatar">
                        {activeChat.initials}
                      </div>
                    )}
                    <div className="chat-message-bubble-wrapper">
                      <div className="chat-message-bubble">
                        {msg.text}
                      </div>
                      <span className="chat-message-time">
                        {msg.sender === 'receptionist' 
                          ? `${msg.time.split(' ')[1] || msg.time} · ${msg.status || 'Đã xem'}`
                          : (msg.time.split(' ')[1] || msg.time)
                        }
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom input area */}
              <form onSubmit={handleSendMessage} className="chat-bottom-input-bar">
                <div className="chat-input-textarea-wrapper">
                  <textarea
                    className="chat-input-textarea"
                    placeholder="Nhập tin nhắn... (Enter để gửi)"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!inputMessage.trim()}
                  aria-label="Gửi tin nhắn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="chat-no-active-conversations">
              <svg className="chat-no-active-conversations-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" width="48" height="48">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 0H8.25m4.125 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 0H12m4.125 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 0h-.375M12 17.25h0.008v.008H12v-.008zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" />
              </svg>
              <p>Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

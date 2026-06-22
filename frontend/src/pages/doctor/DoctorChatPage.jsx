import { useEffect, useRef, useState } from 'react';
import '../receptionist/receptionist.css';
import './doctor.css';

const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-1',
    name: 'Nguyễn Văn A',
    initials: 'NA',
    online: true,
    lastMessage: 'Bác sĩ cho em hỏi cần nhịn ăn trước khi tái khám không ạ?',
    time: '09:15',
    unreadCount: 1,
    messages: [
      { id: 'm-1', sender: 'patient', text: 'Bác sĩ cho em hỏi cần nhịn ăn trước khi tái khám không ạ?', time: '09:15' },
    ],
  },
  {
    id: 'conv-2',
    name: 'Trần Thị Mai',
    initials: 'TM',
    online: false,
    lastMessage: 'Cảm ơn bác sĩ đã hướng dẫn rất kỹ.',
    time: 'Hôm qua',
    unreadCount: 0,
    messages: [
      { id: 'm-2', sender: 'doctor', text: 'Bạn nhớ mang theo kết quả xét nghiệm cũ khi đến khám nhé.', time: 'Hôm qua 15:22', status: 'Đã xem' },
      { id: 'm-3', sender: 'patient', text: 'Cảm ơn bác sĩ đã hướng dẫn rất kỹ.', time: 'Hôm qua 15:25' },
    ],
  },
  {
    id: 'conv-3',
    name: 'Lê Quốc Bảo',
    initials: 'LB',
    online: true,
    lastMessage: 'Tôi đã tải kết quả siêu âm lên rồi ạ.',
    time: '08:40',
    unreadCount: 0,
    messages: [
      { id: 'm-4', sender: 'patient', text: 'Tôi đã tải kết quả siêu âm lên rồi ạ.', time: '08:40' },
    ],
  },
];

const AUTO_REPLIES = {
  'conv-1': 'Bạn không cần nhịn ăn. Tuy nhiên hãy mang theo đơn thuốc và đến trước 10 phút nhé.',
  'conv-2': 'Không có gì, nếu còn triệu chứng mới bạn cứ nhắn thêm cho tôi.',
  'conv-3': 'Tôi đã nhận được kết quả. Khi đến khám tôi sẽ xem kỹ và tư vấn thêm cho bạn.',
};

export default function DoctorChatPage() {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState('conv-1');
  const [search, setSearch] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const messagesEndRef = useRef(null);

  const activeConversation = conversations.find((item) => item.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationId, activeConversation?.messages?.length]);

  const filteredConversations = conversations.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  const unreadCount = conversations.reduce((sum, item) => sum + item.unreadCount, 0);

  const selectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    setConversations((current) => current.map((item) => (
      item.id === conversationId ? { ...item, unreadCount: 0 } : item
    )));
  };

  const sendMessage = (event) => {
    event.preventDefault();
    if (!draftMessage.trim() || !activeConversation) return;

    const text = draftMessage.trim();
    setDraftMessage('');

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const outgoing = {
      id: `out-${Date.now()}`,
      sender: 'doctor',
      text,
      time,
      status: 'Đang gửi...',
    };

    setConversations((current) => current.map((item) => (
      item.id === activeConversationId
        ? {
            ...item,
            lastMessage: text,
            time,
            messages: [...item.messages, outgoing],
          }
        : item
    )));

    setTimeout(() => {
      setConversations((current) => current.map((item) => (
        item.id === activeConversationId
          ? {
              ...item,
              messages: item.messages.map((message) => (
                message.id === outgoing.id ? { ...message, status: 'Đã xem' } : message
              )),
            }
          : item
      )));
    }, 450);

    setTimeout(() => {
      const reply = AUTO_REPLIES[activeConversationId] || 'Tôi đã nhận được tin nhắn của bác sĩ.';
      const replyTime = new Date();
      const replyTimeLabel = `${String(replyTime.getHours()).padStart(2, '0')}:${String(replyTime.getMinutes()).padStart(2, '0')}`;
      const incoming = {
        id: `in-${Date.now()}`,
        sender: 'patient',
        text: reply,
        time: replyTimeLabel,
      };

      setConversations((current) => current.map((item) => (
        item.id === activeConversationId
          ? {
              ...item,
              lastMessage: reply,
              time: replyTimeLabel,
              messages: [...item.messages, incoming],
            }
          : item
      )));
    }, 1500);
  };

  return (
    <div className="doctor-page">
      <div className="doctor-chat-header-bar">
        <h1>Tin nhắn</h1>
        <p>{unreadCount > 0 ? `${unreadCount} tin nhắn chưa đọc` : 'Không có tin nhắn chưa đọc'}</p>
      </div>

      <div className="doctor-chat-notice">
        Giao diện chat đang được dựng theo thiết kế portal bác sĩ. Dữ liệu hiện là mô phỏng cục bộ trong lúc chờ tích hợp realtime đầy đủ từ module chat.
      </div>

      <div className="chat-main-container">
        <div className="chat-left-sidebar">
          <div className="chat-search-container">
            <div className="chat-search-input-shell">
              <svg className="chat-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="chat-search-input"
                placeholder="Tìm bệnh nhân..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="chat-list-scrollable">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`chat-list-item ${conversation.id === activeConversationId ? 'active' : ''}`}
                onClick={() => selectConversation(conversation.id)}
              >
                <div className="chat-item-avatar-wrapper">
                  <div className="chat-item-avatar">{conversation.initials}</div>
                  {conversation.online ? <span className="chat-item-online-dot" /> : null}
                </div>

                <div className="chat-item-meta">
                  <div className="chat-item-name-row">
                    <span className="chat-item-name">{conversation.name}</span>
                    <span className="chat-item-time">{conversation.time}</span>
                  </div>
                  <div className="chat-item-lastmsg-row">
                    <span className="chat-item-preview">{conversation.lastMessage}</span>
                    {conversation.unreadCount > 0 ? (
                      <span className="chat-item-unread-badge">{conversation.unreadCount}</span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="chat-right-panel">
          {activeConversation ? (
            <>
              <div className="chat-panel-header">
                <div className="chat-header-avatar">{activeConversation.initials}</div>
                <div className="chat-header-info">
                  <h3 className="chat-header-name">{activeConversation.name}</h3>
                  <p className="chat-header-status" style={{ color: activeConversation.online ? '#4ADE80' : '#888888' }}>
                    {activeConversation.online ? 'Đang hoạt động' : 'Ngoại tuyến'}
                  </p>
                </div>
              </div>

              <div className="chat-messages-scroll">
                {activeConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message-row ${message.sender === 'doctor' ? 'outgoing' : 'incoming'}`}
                  >
                    {message.sender === 'patient' ? (
                      <div className="chat-message-avatar">{activeConversation.initials}</div>
                    ) : null}
                    <div className="chat-message-bubble-wrapper">
                      <div className="chat-message-bubble">{message.text}</div>
                      <span className="chat-message-time">
                        {message.sender === 'doctor'
                          ? `${message.time} · ${message.status || 'Đã xem'}`
                          : message.time}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-bottom-input-bar" onSubmit={sendMessage}>
                <div className="chat-input-textarea-wrapper">
                  <textarea
                    className="chat-input-textarea"
                    placeholder="Nhập tư vấn cho bệnh nhân..."
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        sendMessage(event);
                      }
                    }}
                  />
                </div>
                <button type="submit" className="chat-send-btn" disabled={!draftMessage.trim()} aria-label="Gửi tin nhắn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="chat-no-active-conversations">
              <div className="chat-no-active-conversations-icon">💬</div>
              <p>Chọn một cuộc trò chuyện để bắt đầu tư vấn</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

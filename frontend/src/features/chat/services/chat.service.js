import axiosInstance from '../../../shared/services/axios.instance.js';

export async function getConversations() {
  const response = await axiosInstance.get('/chat/conversations');
  return response.data;
}

export async function createConversation(payload) {
  const response = await axiosInstance.post('/chat/conversations', payload);
  return response.data;
}

export async function getConversationMessages(conversationId, params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  const url = queryString 
    ? `/chat/conversations/${conversationId}/messages?${queryString}`
    : `/chat/conversations/${conversationId}/messages`;
  
  const response = await axiosInstance.get(url);
  return response.data;
}

export async function sendChatMessage({ conversationId, message, messageType = 'TEXT' }) {
  const response = await axiosInstance.post(`/chat/conversations/${conversationId}/messages`, {
    message,
    messageType
  });
  return response.data;
}

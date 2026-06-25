import axiosInstance from '../../../shared/services/axios.instance.js';

export async function chatWithAIAssistant(payload) {
  const response = await axiosInstance.post('/ai-assistant/chat', payload);
  return response.data;
}

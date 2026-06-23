import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConversations,
  createConversation,
  getConversationMessages,
  sendChatMessage
} from '../services/chat.service.js';

export const CHAT_QUERY_KEYS = {
  all: ['chat'],
  conversations: () => ['chat', 'conversations'],
  messages: (conversationId, params) => {
    const key = ['chat', 'messages', conversationId];
    if (params && Object.keys(params).length > 0) {
      key.push(params);
    }
    return key;
  }
};


export function useConversations(options = {}) {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.conversations(),
    queryFn: getConversations,
    refetchOnWindowFocus: true,
    ...options
  });
}

export function useConversationMessages(conversationId, params = {}, options = {}) {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.messages(conversationId, params),
    queryFn: () => getConversationMessages(conversationId, params),
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    ...options
  });
}

export function useCreateConversation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
      if (options.onSuccess) options.onSuccess(data);
    },
    ...options
  });
}

export function useSendMessage(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data, variables) => {
      // Invalidate both messages and conversations so the last message updates
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations() });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(variables.conversationId) });
      if (options.onSuccess) options.onSuccess(data);
    },
    ...options
  });
}

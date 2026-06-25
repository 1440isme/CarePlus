import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { chatWithAIAssistant } from '../services/ai-assistant.service.js';
import {
  AI_ASSISTANT_ERROR_MESSAGE,
  AI_ASSISTANT_GREETING,
} from '../types/ai-assistant.types.js';

const AI_ASSISTANT_SESSION_STORAGE_KEY = 'careplus.aiAssistant.messages';

function createMessage(role, content, overrides = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function toHistoryPayload(messages) {
  return messages
    .filter((message) => !message.isGreeting)
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function createInitialMessages() {
  return [
    createMessage('assistant', AI_ASSISTANT_GREETING, { isGreeting: true }),
  ];
}

function readMessagesFromSessionStorage() {
  if (typeof window === 'undefined') {
    return createInitialMessages();
  }

  try {
    const rawValue = window.sessionStorage.getItem(AI_ASSISTANT_SESSION_STORAGE_KEY);

    if (!rawValue) {
      return createInitialMessages();
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return createInitialMessages();
    }

    return parsedValue;
  } catch {
    return createInitialMessages();
  }
}

function persistMessagesToSessionStorage(messages) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(
      AI_ASSISTANT_SESSION_STORAGE_KEY,
      JSON.stringify(messages),
    );
  } catch {
    // Ignore session storage errors so chat UI still works in restricted browsers.
  }
}

export function useAIAssistantChat() {
  const [messages, setMessages] = useState(() => readMessagesFromSessionStorage());

  const mutation = useMutation({
    mutationFn: chatWithAIAssistant,
  });

  const sendMessage = async (rawMessage) => {
    const message = rawMessage.trim();

    if (!message || mutation.isPending) {
      return;
    }

    const userMessage = createMessage('user', message);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    persistMessagesToSessionStorage(nextMessages);

    try {
      const response = await mutation.mutateAsync({
        message,
        history: toHistoryPayload(messages),
      });

      const reply = response?.data?.reply || AI_ASSISTANT_ERROR_MESSAGE;
      setMessages((currentMessages) => {
        const updatedMessages = [
          ...currentMessages,
          createMessage('assistant', reply),
        ];
        persistMessagesToSessionStorage(updatedMessages);
        return updatedMessages;
      });
    } catch (error) {
      setMessages((currentMessages) => {
        const updatedMessages = [
          ...currentMessages,
          createMessage('assistant', error?.message || AI_ASSISTANT_ERROR_MESSAGE, { isError: true }),
        ];
        persistMessagesToSessionStorage(updatedMessages);
        return updatedMessages;
      });
    }
  };

  return {
    messages,
    sendMessage,
    isLoading: mutation.isPending,
  };
}

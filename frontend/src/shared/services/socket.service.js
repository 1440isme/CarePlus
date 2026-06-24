import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket) {
      const oldToken = this.socket.auth?.token;
      this.socket.auth = { token };
      
      if (this.socket.connected) {
        if (oldToken !== token) {
          console.log('⚡ Socket token changed, reconnecting with new token...');
          this.socket.disconnect().connect();
        }
        return;
      }
      this.socket.connect();
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to CarePlus Socket Server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('⚡ Disconnected from CarePlus Socket Server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚡ Socket connection error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('⚡ Disconnected CarePlus Socket manually');
    }
  }

  joinConversation(conversationId) {
    if (!this.socket) return;
    this.socket.emit('join:conversation', { conversationId });
  }

  leaveConversation(conversationId) {
    if (!this.socket) return;
    this.socket.emit('leave:conversation', { conversationId });
  }

  emitTyping(conversationId, isTyping) {
    if (!this.socket) return;
    this.socket.emit('chat:typing', { conversationId, isTyping });
  }

  onMessageReceived(callback) {
    if (!this.socket) return () => {};
    this.socket.on('chat:message-received', callback);
    return () => this.socket.off('chat:message-received', callback);
  }

  onTypingStateChange(callback) {
    if (!this.socket) return () => {};
    this.socket.on('chat:typing', callback);
    return () => this.socket.off('chat:typing', callback);
  }

  onNotification(callback) {
    if (!this.socket) return () => {};
    this.socket.on('notification:new', callback);
    return () => this.socket.off('notification:new', callback);
  }
}

export default new SocketService();

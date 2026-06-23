class SocketService {
  constructor() {
    this.io = null;
  }

  /**
   * Set the Socket.IO server instance.
   * To be called by Developer 4 during Socket server initialization.
   * @param {object} io - Socket.IO server instance
   */
  setIo(io) {
    this.io = io;
    console.log('✅ SocketService initialized with Socket.IO instance');
  }

  /**
   * Emit an event to a specific room.
   * @param {string} room 
   * @param {string} event 
   * @param {any} data 
   */
  emitToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    } else {
      console.log(`[SocketStub] Emit to room "${room}" -> Event: "${event}":`, JSON.stringify(data));
    }
  }

  /**
   * Emit an event to a specific user room.
   * @param {string} userId 
   * @param {string} event 
   * @param {any} data 
   */
  emitToUser(userId, event, data) {
    this.emitToRoom(`user:${userId}`, event, data);
  }

  /**
   * Emit an event to a specific role room.
   * @param {string} role 
   * @param {string} event 
   * @param {any} data 
   */
  emitToRole(role, event, data) {
    const normalizedRole = String(role).toLowerCase();
    this.emitToRoom(`role:${normalizedRole}`, event, data);
  }

  /**
   * Broadcast an event to all connected clients.
   * @param {string} event 
   * @param {any} data 
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    } else {
      console.log(`[SocketStub] Broadcast -> Event: "${event}":`, JSON.stringify(data));
    }
  }
}

module.exports = new SocketService();

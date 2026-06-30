const jwt = require('jsonwebtoken');
const prisma = require('../database/prisma.client');

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  const list = {};
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
}

/**
 * Socket.IO authentication middleware.
 */
async function socketAuthMiddleware(socket, next) {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token && socket.request.headers.cookie) {
      const cookies = parseCookies(socket.request.headers.cookie);
      token = cookies.accessToken;
    }

    if (!token) {
      // Connect as guest (useful for public SUPPORT chat if supported, or we just allow empty user)
      socket.user = null;
      return next();
    }

    const accessTokenSecret = process.env.JWT_SECRET;
    if (!accessTokenSecret) {
      return next(new Error('JWT Secret config missing'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, accessTokenSecret);
    } catch (err) {
      // Token invalid or expired - treat as guest instead of throwing to prevent connection failure
      socket.user = null;
      return next();
    }

    const { userId, role, jti } = decoded;
    if (!userId || !role || !jti) {
      socket.user = null;
      return next();
    }

    // Success, bind user details
    socket.user = { userId, role };
    return next();
  } catch (error) {
    console.error('[SocketAuth] Unexpected error:', error);
    socket.user = null;
    return next();
  }
}

/**
 * Register Socket event handlers.
 */
function handleSocketConnection(io, socket) {
  const user = socket.user;
  
  if (user) {
    const { userId, role } = user;
    console.log(`🔌 User connected: ${userId} (${role}) - Socket: ${socket.id}`);
    
    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Join role-specific room
    socket.join(`role:${String(role).toLowerCase()}`);
  } else {
    console.log(`🔌 Guest connected - Socket: ${socket.id}`);
    socket.join('user:guest');
    socket.join('role:guest');
  }

  // Event: Join conversation room
  socket.on('join:conversation', async ({ conversationId }) => {
    try {
      if (!conversationId) return;

      // Guest cannot join conversation unless they authenticate
      if (!user) {
        socket.emit('error:socket', { message: 'Yêu cầu đăng nhập để vào phòng chat' });
        return;
      }

      const { userId, role } = user;

      // Verify conversation exists and user has access
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) {
        socket.emit('error:socket', { message: 'Cuộc trò chuyện không tồn tại' });
        return;
      }

      let hasAccess = false;
      if (role === 'ADMIN') {
        hasAccess = true;
      } else if (role === 'RECEPTIONIST') {
        // Receptionists have access to SUPPORT chats
        hasAccess = conversation.type === 'SUPPORT';
      } else if (role === 'PATIENT') {
        hasAccess = conversation.patientId === userId;
      } else if (role === 'DOCTOR') {
        // Find doctor profile for this user
        const doctor = await prisma.doctor.findUnique({
          where: { userId }
        });
        hasAccess = doctor && conversation.doctorId === doctor.id;
      }

      if (hasAccess) {
        socket.join(`conversation:${conversationId}`);
        console.log(`👤 Socket ${socket.id} joined conversation:${conversationId}`);
        socket.emit('conversation:joined', { conversationId });
      } else {
        console.warn(`⚠️ Access denied for ${userId} (${role}) to conversation:${conversationId}`);
        socket.emit('error:socket', { message: 'Không có quyền truy cập cuộc trò chuyện này' });
      }
    } catch (error) {
      console.error('[Socket] Error in join:conversation:', error);
    }
  });

  // Event: Leave conversation room
  socket.on('leave:conversation', ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`conversation:${conversationId}`);
    console.log(`👤 Socket ${socket.id} left conversation:${conversationId}`);
  });

  // Event: Typing indicator
  socket.on('chat:typing', ({ conversationId, isTyping }) => {
    if (!conversationId || !user) return;
    
    // Broadcast typing event to other users in the room
    socket.to(`conversation:${conversationId}`).emit('chat:typing', {
      conversationId,
      userId: user.userId,
      isTyping: !!isTyping
    });
  });

  // Event: Disconnect
  socket.on('disconnect', () => {
    if (user) {
      console.log(`🔌 User disconnected: ${user.userId} - Socket: ${socket.id}`);
    } else {
      console.log(`🔌 Guest disconnected - Socket: ${socket.id}`);
    }
  });
}

module.exports = {
  socketAuthMiddleware,
  handleSocketConnection
};

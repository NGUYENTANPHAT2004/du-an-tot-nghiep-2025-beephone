/**
 * Chat socket implementation
 */
const { 
  handleInitChat, 
  handleIncomingMessage, 
  handleMessageFeedback, 
  handleGetHistory, 
  handleEndChat 
} = require('./chat/handlers/Chathandle');

/**
 * Configure chat socket functionality
 * @param {Object} io - Socket.io instance
 */
const setupChatSocket = (io) => {
  const chatNamespace = io.of('/chat');
  
  chatNamespace.on('connection', (socket) => {
    console.log(`✅ New chat connection: ${socket.id}`);
    
    // Store client info for analytics and tracking
    const clientInfo = {
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      time: new Date().toISOString()
    };
    socket.clientInfo = clientInfo;
    
    // Restore session if sessionId is provided
    if (socket.handshake.query.sessionId) {
      socket.sessionId = socket.handshake.query.sessionId;
      socket.join(socket.sessionId);
      console.log(`🔄 Chat session restored: ${socket.sessionId}`);
      
      socket.emit('session_restored', {
        sessionId: socket.sessionId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Keep-alive ping/pong
    socket.on('ping', (callback) => {
      if (typeof callback === 'function') {
        callback({ status: 'ok', time: new Date().toISOString() });
      }
    });
    
    // Initialize chat session
    socket.on('init_chat', (data) => {
      handleInitChat(socket, data);
    });
    
    // Process user message
    socket.on('user_message', (data) => {
      // Send typing indicator
      socket.emit('ai_typing');
      
      // Use socket's sessionId if not provided in data
      if (!data.sessionId && socket.sessionId) {
        data.sessionId = socket.sessionId;
      }
      
      handleIncomingMessage(socket, chatNamespace, data);
    });
    
    // Handle message feedback
    socket.on('message_feedback', (data) => {
      handleMessageFeedback(socket, data);
    });
    
    // Get chat history
    socket.on('get_history', (data = {}) => {
      // Use socket's sessionId if not provided in data
      if (!data.sessionId && socket.sessionId) {
        data.sessionId = socket.sessionId;
      }
      
      handleGetHistory(socket, data);
    });
    
    // End chat session
    socket.on('end_chat', () => {
      handleEndChat(socket);
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ Chat disconnected: ${socket.id}, reason: ${reason}`);
      
      // Auto-end session if active
      if (socket.sessionId) {
        handleEndChat(socket).catch(error => {
          console.error('Error auto-ending chat session:', error);
        });
      }
    });
  });
  
  console.log('✅ Chat socket handlers initialized');
  return chatNamespace;
};

/**
 * Send message to a specific chat session
 * @param {Object} io - Socket.io instance
 * @param {string} sessionId - Chat session ID
 * @param {string} event - Event name
 * @param {Object} data - Message data
 */
const sendToSession = (io, sessionId, event, data) => {
  if (!io || !sessionId) return;
  
  const chatNamespace = io.of('/chat');
  chatNamespace.to(sessionId).emit(event, {
    ...data,
    sessionId,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📤 Sent ${event} to session ${sessionId}`);
};

module.exports = {
  setupChatSocket,
  sendToSession
};
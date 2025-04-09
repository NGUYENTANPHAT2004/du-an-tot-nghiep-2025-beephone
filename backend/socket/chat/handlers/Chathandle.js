/**
 * Chat message handlers
 */
const ChatController = require('../../chat/ChatController');

/**
 * Initialize a new chat session
 * @param {Object} socket - Socket connection
 * @param {Object} data - Session initialization data
 */
const handleInitChat = async (socket, data) => {
  try {
    console.log('🟢 Initializing chat session');
    
    // Parse user data from socket or request data
    const userData = {
      userId: socket.user?._id || data?.userId,
      guestInfo: (!socket.user && data?.guestInfo) ? data.guestInfo : null
    };
    
    // Create new session
    const session = await ChatController.createSession(userData, socket.clientInfo);
    
    // Join room with session ID
    const sessionId = session._id.toString();
    socket.sessionId = sessionId;
    socket.join(sessionId);
    
    // Notify client
    socket.emit('chat_initialized', {
      sessionId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Chat session initialized: ${sessionId}`);
  } catch (error) {
    console.error('❌ Error initializing chat:', error);
    socket.emit('chat_error', {
      error: 'initialization_error',
      message: error.message || 'Could not initialize chat session',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Process an incoming user message
 * @param {Object} socket - Socket connection
 * @param {Object} io - Socket.io instance or namespace
 * @param {Object} data - Message data
 */
const handleIncomingMessage = async (socket, io, data) => {
  try {
    if (!data || !data.message) {
      throw new Error('Invalid message data');
    }
    
    // Use socket's sessionId if not provided in data
    const sessionId = data.sessionId || socket.sessionId;
    
    if (!sessionId) {
      throw new Error('No active session');
    }
    
    console.log(`📨 Processing message in session ${sessionId}: "${data.message.substring(0, 30)}..."`);
    
    // Process message
    const userId = socket.user?._id || null;
    const guestInfo = (!socket.user && data.guestInfo) ? data.guestInfo : null;
    
    // Indicate AI is typing
    socket.emit('ai_typing');
    
    const response = await ChatController.processMessage(
      sessionId,
      data.message,
      userId,
      guestInfo,
      socket.clientInfo
    );
    
    // Send response back to user
    socket.emit('ai_response', {
      ...response,
      sessionId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Processed message in session ${sessionId}`);
  } catch (error) {
    console.error('❌ Error processing message:', error);
    socket.emit('chat_error', {
      error: 'message_processing_error',
      message: error.message || 'Could not process message',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Save user feedback about an AI message
 * @param {Object} socket - Socket connection
 * @param {Object} data - Feedback data
 */
const handleMessageFeedback = async (socket, data) => {
  try {
    if (!data || !data.messageId) {
      throw new Error('Invalid feedback data');
    }
    
    await ChatController.saveFeedback(
      data.messageId,
      data.isHelpful,
      data.comment || ''
    );
    
    socket.emit('feedback_received', {
      messageId: data.messageId,
      status: 'success',
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Feedback saved for message ${data.messageId}`);
  } catch (error) {
    console.error('❌ Error saving feedback:', error);
    socket.emit('chat_error', {
      error: 'feedback_error',
      message: error.message || 'Could not save feedback',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retrieve chat history for a session
 * @param {Object} socket - Socket connection
 * @param {Object} data - Request data containing sessionId
 */
const handleGetHistory = async (socket, data = {}) => {
  try {
    const sessionId = data.sessionId || socket.sessionId;
    
    if (!sessionId) {
      throw new Error('No session ID provided');
    }
    
    const history = await ChatController.getSessionHistory(sessionId);
    
    socket.emit('chat_history', {
      sessionId,
      messages: history,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Chat history retrieved for session ${sessionId}`);
  } catch (error) {
    console.error('❌ Error retrieving chat history:', error);
    socket.emit('chat_error', {
      error: 'history_error',
      message: error.message || 'Could not retrieve chat history',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * End a chat session
 * @param {Object} socket - Socket connection
 */
const handleEndChat = async (socket) => {
  try {
    if (!socket.sessionId) {
      throw new Error('No active session');
    }
    
    await ChatController.endSession(socket.sessionId);
    
    socket.emit('chat_ended', {
      sessionId: socket.sessionId,
      timestamp: new Date().toISOString()
    });
    
    // Leave room
    socket.leave(socket.sessionId);
    console.log(`✅ Chat session ended: ${socket.sessionId}`);
    
    // Clear session
    const oldSessionId = socket.sessionId;
    socket.sessionId = null;
    
    return oldSessionId;
  } catch (error) {
    console.error('❌ Error ending chat session:', error);
    socket.emit('chat_error', {
      error: 'end_session_error',
      message: error.message || 'Could not end chat session',
      timestamp: new Date().toISOString()
    });
    return null;
  }
};

module.exports = {
  handleInitChat,
  handleIncomingMessage,
  handleMessageFeedback,
  handleGetHistory,
  handleEndChat
};
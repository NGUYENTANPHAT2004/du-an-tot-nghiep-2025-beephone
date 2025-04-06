/**
 * Main entry point for chat socket functionality
 */
require('dotenv').config();
const { 
  handleIncomingMessage, 
  handleInitChat, 
  handleMessageFeedback, 
  handleGetHistory, 
  handleEndChat 
} = require('./chat/handlers/Chathandle');

/**
 * Initialize chat socket handlers
 * @param {Object} io - Socket.io instance
 */
const initChatHandlers = (io) => {
  // Create a namespace for chat
  const chatNamespace = io.of('/chat');

  // Add connection event listeners
  chatNamespace.on('connection', (socket) => {
    console.log(`✅ Kết nối chat mới: ${socket.id}`);
    
    // Lưu thông tin client vào socket để dễ dàng theo dõi
    const clientInfo = {
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      time: new Date().toISOString()
    };
    socket.clientInfo = clientInfo;
    
    // Thêm xử lý để khôi phục phiên nếu có sessionId từ client
    if (socket.handshake.query.sessionId) {
      socket.sessionId = socket.handshake.query.sessionId;
      socket.join(socket.sessionId);
      console.log(`🔄 Khôi phục phiên chat: ${socket.sessionId}`);
      
      // Thông báo cho client rằng đã khôi phục phiên thành công
      socket.emit('session_restored', {
        sessionId: socket.sessionId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Thêm ping/pong để giữ kết nối
    socket.on('ping', (callback) => {
      if (typeof callback === 'function') {
        callback({ status: 'ok', time: new Date().toISOString() });
      }
    });
    
    // Initialize chat
    socket.on('init_chat', (data) => {
      try {
        handleInitChat(socket, data);
      } catch (error) {
        console.error('❌ Lỗi khi khởi tạo chat:', error);
        socket.emit('chat_error', {
          error: 'initialization_error',
          message: error.message || 'Không thể khởi tạo phiên chat',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // User message handler with improved error handling
    socket.on('user_message', (data) => {
      try {
        // Kiểm tra dữ liệu trước khi xử lý
        if (!data || !data.message) {
          throw new Error('Tin nhắn không hợp lệ');
        }
        
        // Thêm sessionId từ socket nếu client không cung cấp
        if (!data.sessionId && socket.sessionId) {
          data.sessionId = socket.sessionId;
        }
        
        // Gửi trạng thái "đang gõ" đến client
        socket.emit('ai_typing');
        
        // Xử lý tin nhắn
        handleIncomingMessage(socket, chatNamespace, data);
      } catch (error) {
        console.error('❌ Lỗi khi xử lý tin nhắn:', error);
        socket.emit('chat_error', {
          error: 'message_processing_error',
          message: error.message || 'Không thể xử lý tin nhắn',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Message feedback handler with improved error handling
    socket.on('message_feedback', (data) => {
      try {
        if (!data || !data.messageId) {
          throw new Error('Dữ liệu phản hồi không hợp lệ');
        }
        handleMessageFeedback(socket, data);
      } catch (error) {
        console.error('❌ Lỗi khi xử lý phản hồi:', error);
        socket.emit('chat_error', {
          error: 'feedback_error',
          message: error.message || 'Không thể lưu phản hồi',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Get chat history with improved error handling
    socket.on('get_history', (data = {}) => {
      try {
        // Sử dụng sessionId từ socket nếu client không cung cấp
        if (!data.sessionId && socket.sessionId) {
          data.sessionId = socket.sessionId;
        }
        
        if (!data.sessionId) {
          throw new Error('Thiếu sessionId');
        }
        
        handleGetHistory(socket, data);
      } catch (error) {
        console.error('❌ Lỗi khi lấy lịch sử chat:', error);
        socket.emit('chat_error', {
          error: 'history_error',
          message: error.message || 'Không thể lấy lịch sử chat',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // End chat session with improved error handling
    socket.on('end_chat', () => {
      try {
        if (!socket.sessionId) {
          throw new Error('Không có phiên chat đang hoạt động');
        }
        
        handleEndChat(socket);
      } catch (error) {
        console.error('❌ Lỗi khi kết thúc phiên chat:', error);
        socket.emit('chat_error', {
          error: 'end_session_error',
          message: error.message || 'Không thể kết thúc phiên chat',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Disconnect handler with improved error handling
    socket.on('disconnect', (reason) => {
      console.log(`❌ Ngắt kết nối chat: ${socket.id}, lý do: ${reason}`);
      
      // End session if active
      if (socket.sessionId) {
        handleEndChat(socket).catch(error => {
          console.error('Lỗi khi tự động kết thúc phiên chat:', error);
        });
      }
    });
  });

  console.log('✅ Khởi tạo chat handlers thành công');
  return chatNamespace;
};

/**
 * Gửi thông báo đến một phiên chat cụ thể
 * @param {Object} io - Socket.io instance
 * @param {string} sessionId - ID của phiên chat
 * @param {string} event - Tên sự kiện
 * @param {any} data - Dữ liệu để gửi
 */
const sendToSession = (io, sessionId, event, data) => {
  if (!io || !sessionId) return;
  
  const chatNamespace = io.of('/chat');
  chatNamespace.to(sessionId).emit(event, {
    ...data,
    sessionId,
    timestamp: new Date().toISOString()
  });
};

// Export the initialization function and utilities
module.exports = { 
  initChatHandlers,
  sendToSession
};
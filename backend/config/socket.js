const socketIo = require('socket.io');

let io;

/**
 * Initialize Socket.io with HTTP server
 * @param {Object} server - HTTP server instance
 * @returns {Object} io - Socket.io instance
 */
const initSocket = (server) => {
  io = socketIo(server, { 
    cors: { 
      origin: "*",  // Trong môi trường production, nên giới hạn domain cụ thể
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],  // Hỗ trợ cả WebSocket và polling
    allowEIO3: true,  // Cho phép tương thích với Socket.io v2 clients
    maxHttpBufferSize: 1e8  // Tăng buffer size cho các tin nhắn lớn (100MB)
  });
  
  console.log("✅ Socket.io đã được khởi tạo!");
  return io;
};

/**
 * Get the Socket.io instance
 * @returns {Object} io - Socket.io instance
 */
const getIo = () => {
  if (!io) {
    throw new Error("Socket.io chưa được khởi tạo!");
  }
  return io;
};

/**
 * Cấu hình middleware chung cho tất cả các kết nối Socket.io
 * @param {Function} middleware - Middleware function to apply
 */
const useMiddleware = (middleware) => {
  if (!io) {
    throw new Error("Socket.io chưa được khởi tạo! Hãy gọi initSocket trước.");
  }
  io.use(middleware);
};

/**
 * Phát sóng một sự kiện đến tất cả các clients đã kết nối
 * @param {string} event - Tên sự kiện
 * @param {any} data - Dữ liệu để gửi
 */
const broadcastEvent = (event, data) => {
  if (!io) {
    throw new Error("Socket.io chưa được khởi tạo!");
  }
  io.emit(event, data);
};

module.exports = { initSocket, getIo, useMiddleware, broadcastEvent };
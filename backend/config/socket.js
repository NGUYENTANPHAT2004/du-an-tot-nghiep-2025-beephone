const socketIo = require('socket.io');

let io;

/**
 * Initialize Socket.io with HTTP server
 * @param {Object} server - HTTP server instance
 * @returns {Object} io - Socket.io instance
 */
const initSocket = (server) => {
  io = socketIo(server, { 
    cors: { origin: "*" },
    pingTimeout: 60000
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

module.exports = { initSocket, getIo };
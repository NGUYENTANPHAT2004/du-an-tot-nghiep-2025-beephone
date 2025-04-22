// socket/socket.js
// File này để export socket instance từ config/socket
// Giải quyết vấn đề circular dependency

// Tham chiếu đến config/socket 
const socketConfig = require('../config/socket');

// Export các hàm của config/socket
module.exports = socketConfig;
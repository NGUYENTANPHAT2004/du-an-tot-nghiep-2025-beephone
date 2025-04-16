// socket/adminSocket.js
const { handleCheckStock } = require('./handlers/stockHandlers');
const { handleNewOrder, handleOrderStatusUpdate } = require('./handlers/orderHandlers');

/**
 * Configure admin socket functionality
 * @param {Object} io - Socket.io instance
 */
const setupAdminSocket = (io) => {
  const adminNamespace = io.of('/admin');
  
  adminNamespace.on('connection', (socket) => {
    console.log(`✅ Admin connected: ${socket.id} - Role: ${socket.user?.role || 'Unknown'}`);
    
    // Stock management events
    socket.on('check_stock', () => handleCheckStock(socket));
    
    // Order management events
    socket.on('new_order', (data) => handleNewOrder(socket, adminNamespace, data));
    socket.on('update_order_status', (data) => handleOrderStatusUpdate(socket, adminNamespace, data));
    
    // Dashboard events
    socket.on('get_dashboard_stats', () => {
      // Implementation for real-time dashboard statistics
      // This could fetch current day's sales, orders, etc.
      socket.emit('dashboard_stats', {
        status: 'success',
        data: {
          activeUsers: Math.floor(Math.random() * 100),
          todayOrders: Math.floor(Math.random() * 50),
          lastUpdated: new Date().toISOString()
        }
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ Admin disconnected: ${socket.id}, reason: ${reason}`);
    });
  });
  
  return adminNamespace;
};

/**
 * Send notification to all admin users
 * @param {Object} io - Socket.io instance
 * @param {string} event - Event name
 * @param {Object} data - Notification data
 */
const notifyAdmins = (io, event, data) => {
  const adminNamespace = io.of('/admin');
  
  adminNamespace.emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📢 Admin notification sent: ${event}`);
};

module.exports = {
  setupAdminSocket,
  notifyAdmins
};
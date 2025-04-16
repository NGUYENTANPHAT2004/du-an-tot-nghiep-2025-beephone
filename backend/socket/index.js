/**
 * Main entry point for socket functionality
 */
const { setupAdminSocket } = require('./adminnotifi');
const { setupChatSocket } = require('./chatsocket');
const { setupStoreSocket } = require('./storesocket');

/**
 * Initialize all socket handlers
 * @param {Object} io - Socket.io instance
 * @returns {Object} - Socket namespaces
 */
const initSocketHandlers = (io) => {
  console.log('🚀 Initializing socket handlers...');
  
  // Initialize each namespace with its handlers
  const adminNamespace = setupAdminSocket(io);
  const chatNamespace = setupChatSocket(io);
  const storeNamespace = setupStoreSocket(io);
  
  // Set up global error handler
  io.engine.on('connection_error', (err) => {
    console.error('❌ Socket.io connection error:', err);
  });
  
  console.log('✅ All socket handlers initialized successfully');
  
  return {
    admin: adminNamespace,
    chat: chatNamespace,
    store: storeNamespace
  };
};

/**
 * Broadcast a global announcement to all connected clients
 * @param {Object} io - Socket.io instance
 * @param {string} message - Announcement message
 * @param {string} type - Announcement type
 */
const broadcastAnnouncement = (io, message, type = 'info') => {
  if (!io || !message) return;
  
  // Send to all namespaces
  ['admin', 'chat', 'store'].forEach(namespace => {
    io.of(`/${namespace}`).emit('system_announcement', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
  });
  
  console.log(`📢 System announcement sent: ${message}`);
};

module.exports = { 
  initSocketHandlers,
  broadcastAnnouncement
};
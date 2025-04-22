// config/socket.js
const socketIo = require('socket.io');
const { authMiddleware } = require('../socket/chat/middlewares/authMiddleware');
const { adminMiddleware } = require('../socket/chat/middlewares/Addminmidleware');

let io;

/**
 * Initialize Socket.io with HTTP server
 * @param {Object} server - HTTP server instance
 * @returns {Object} io - Socket.io instance
 */
const initSocket = (server) => {
  io = socketIo(server, { 
    cors: { 
      origin: "*",  // In production, limit to specific domains
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    maxHttpBufferSize: 1e8  // 100MB buffer size for large messages
  });
  
  // Initialize different socket namespaces
  initNamespaces(io);
  
  console.log("✅ Socket.io initialized successfully!");
  return io;
};

/**
 * Initialize different namespaces with their middlewares
 * @param {Object} io - Socket.io instance
 */
const initNamespaces = (io) => {
  // Admin namespace with admin middleware
  const adminNamespace = io.of('/admin');
  adminNamespace.use(adminMiddleware);
  
  // Chat namespace with auth middleware (allows guest access)
  const chatNamespace = io.of('/chat');
  chatNamespace.use(authMiddleware);
  
  // Store namespace (for customer notifications)
  const storeNamespace = io.of('/store');
  
  console.log("✅ Socket.io namespaces configured!");
};

/**
 * Get the Socket.io instance
 * @returns {Object} io - Socket.io instance
 */
const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

/**
 * Get a specific namespace
 * @param {string} namespace - Namespace path (e.g., '/admin', '/chat')
 * @returns {Object} namespace - Socket.io namespace
 */
const getNamespace = (namespace) => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io.of(namespace);
};

/**
 * Apply middleware to all Socket.io connections
 * @param {Function} middleware - Middleware function to apply
 */
const useMiddleware = (middleware) => {
  if (!io) {
    throw new Error("Socket.io not initialized! Call initSocket first.");
  }
  io.use(middleware);
};

/**
 * Broadcast an event to all connected clients
 * @param {string} event - Event name
 * @param {any} data - Data to send
 * @param {string} namespace - Optional namespace (default: main namespace)
 */
const broadcastEvent = (event, data, namespace = null) => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  
  if (namespace) {
    io.of(namespace).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  } else {
    io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { 
  initSocket, 
  getIo, 
  getNamespace,
  useMiddleware, 
  broadcastEvent 
};
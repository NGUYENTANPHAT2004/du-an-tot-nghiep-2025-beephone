import io from 'socket.io-client';

let socket = null;

/**
 * Initialize socket connection
 * @returns {Object} socket - Socket.io client instance
 */
export const initializeSocket = () => {
  if (!socket) {
    socket = io('http://localhost:3005');
    
    // Setup heartbeat to keep connection alive
    setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000); // 30 seconds
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
    
    socket.on('pong', (data) => {
      console.log('Server responded at:', data.time);
    });
  }
  
  return socket;
};

/**
 * Get the socket instance if already initialized
 * @returns {Object|null} socket - Socket.io client instance or null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Register stock alert listeners
 * @param {Function} onLowStock - Callback for low stock alerts
 * @param {Function} onStockStatus - Callback for stock status updates
 * @param {Function} onStockError - Callback for stock errors
 */
export const registerStockListeners = (onLowStock, onStockStatus, onStockError) => {
  if (!socket) {
    initializeSocket();
  }
  
  socket.on('lowStockAlert', onLowStock);
  socket.on('stockStatus', onStockStatus);
  socket.on('stockError', onStockError);
  
  return () => {
    socket.off('lowStockAlert', onLowStock);
    socket.off('stockStatus', onStockStatus);
    socket.off('stockError', onStockError);
  };
};

/**
 * Register order notification listeners
 * @param {Function} onNewOrder - Callback for new order notifications
 * @param {Function} onStatusChange - Callback for order status changes
 */
// export const registerOrderListeners = (onNewOrder, onStatusChange) => {
//   if (!socket) {
//     initializeSocket();
//   }
  
//   socket.on('newOrderNotification', onNewOrder);
//   socket.on('orderStatusChanged', onStatusChange);
  
//   return () => {
//     socket.off('newOrderNotification', onNewOrder);
//     socket.off('orderStatusChanged', onStatusChange);
//   };
// };

// /**
//  * Register product update listeners
//  * @param {Function} onPriceChange - Callback for price changes
//  * @param {Function} onNewProduct - Callback for new products
//  */
// export const registerProductListeners = (onPriceChange, onNewProduct) => {
//   if (!socket) {
//     initializeSocket();
//   }
  
//   socket.on('productPriceChanged', onPriceChange);
//   socket.on('newProductAdded', onNewProduct);
  
//   return () => {
//     socket.off('productPriceChanged', onPriceChange);
//     socket.off('newProductAdded', onNewProduct);
//   };
// };

/**
 * Check current inventory levels
 */
export const checkStock = () => {
  if (!socket) {
    initializeSocket();
  }
  
  socket.emit('check_stock');
};
// socket/storeSocket.js
const { generateVoucherForUser, isFirstOrderVoucherEligible, isThirdOrderVoucherEligible } = require('./handlers/voucherGenerator');

/**
 * Configure store socket functionality for customer notifications
 * @param {Object} io - Socket.io instance
 */
const setupStoreSocket = (io) => {
  const storeNamespace = io.of('/store');
  
  storeNamespace.on('connection', (socket) => {
    console.log(`✅ Store client connected: ${socket.id}`);
    
    // Associate user with their phone number for targeted notifications
    socket.on('register_user', (data) => {
      if (data && data.phone) {
        // Store phone in socket for targeting
        socket.phone = data.phone;
        socket.join(`user_${data.phone}`); // Join user-specific room
        
        console.log(`👤 User registered with phone: ${data.phone}`);
        socket.emit('registration_success', {
          status: 'success',
          message: 'Registered for notifications',
          timestamp: new Date().toISOString()
        });
      } else {
        socket.emit('registration_error', {
          status: 'error',
          message: 'Phone number is required',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Client requesting voucher check
    socket.on('check_vouchers', async (data) => {
      try {
        if (!data || !data.phone) {
          throw new Error('Phone number is required');
        }
        
        const phone = data.phone;
        
        // Check eligibility for various voucher types
        const isFirstOrderEligible = await isFirstOrderVoucherEligible(phone);
        const isThirdOrderEligible = await isThirdOrderVoucherEligible(phone);
        
        // Generate eligible vouchers
        let vouchers = [];
        
        if (isFirstOrderEligible) {
          const firstOrderVoucher = await generateVoucherForUser(phone, 'first-order');
          if (firstOrderVoucher && firstOrderVoucher.isNew) {
            vouchers.push(firstOrderVoucher);
          }
        }
        
        if (isThirdOrderEligible) {
          const loyaltyVoucher = await generateVoucherForUser(phone, 'third-order');
          if (loyaltyVoucher && loyaltyVoucher.isNew) {
            vouchers.push(loyaltyVoucher);
          }
        }
        
        // Random chance to generate a reward voucher
        if (Math.random() < 0.2) { // 20% chance
          const rewardVoucher = await generateVoucherForUser(phone, 'reward');
          if (rewardVoucher && rewardVoucher.isNew) {
            vouchers.push(rewardVoucher);
          }
        }
        
        // Send vouchers to user
        socket.emit('voucher_update', {
          status: 'success',
          vouchers,
          hasNewVouchers: vouchers.length > 0,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Checked vouchers for ${phone}: ${vouchers.length} new vouchers`);
      } catch (error) {
        console.error('❌ Error checking vouchers:', error);
        socket.emit('voucher_error', {
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Track order status
    socket.on('track_order', (data) => {
      if (!data || !data.orderCode) {
        socket.emit('tracking_error', {
          status: 'error',
          message: 'Order code is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Join order-specific room for real-time updates
      socket.join(`order_${data.orderCode}`);
      
      socket.emit('tracking_started', {
        status: 'success',
        orderCode: data.orderCode,
        message: 'You will receive real-time updates for this order',
        timestamp: new Date().toISOString()
      });
      
      console.log(`📦 User started tracking order: ${data.orderCode}`);
    });
    
    // Handle store promotions subscription
    socket.on('subscribe_promotions', (data) => {
      if (data && data.categories) {
        // Store preferences
        socket.preferences = data.categories;
        
        // Join category-specific rooms
        data.categories.forEach(category => {
          socket.join(`promo_${category}`);
        });
        
        socket.emit('subscription_success', {
          status: 'success',
          message: 'Subscribed to promotions',
          categories: data.categories,
          timestamp: new Date().toISOString()
        });
        
        console.log(`📣 User subscribed to promotions: ${data.categories.join(', ')}`);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ Store client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });
  
  return storeNamespace;
};

/**
 * Send order status update to customers
 * @param {Object} io - Socket.io instance
 * @param {string} orderCode - Order code
 * @param {string} status - New status
 * @param {string} phone - Customer phone number
 */
const notifyOrderStatus = (io, orderCode, status, phone) => {
  if (!io || !orderCode) return;
  
  const storeNamespace = io.of('/store');
  const message = {
    orderCode,
    status,
    message: getStatusMessage(status),
    timestamp: new Date().toISOString()
  };
  
  // Send to order-specific room
  storeNamespace.to(`order_${orderCode}`).emit('order_status_update', message);
  
  // Send to user's phone if available
  if (phone) {
    storeNamespace.to(`user_${phone}`).emit('order_status_update', message);
  }
  
  console.log(`📦 Order status notification sent: ${orderCode} - ${status}`);
};

/**
 * Send promotion notification to customers
 * @param {Object} io - Socket.io instance
 * @param {string} category - Product category
 * @param {Object} promotionData - Promotion details
 */
const notifyPromotion = (io, category, promotionData) => {
  if (!io || !category || !promotionData) return;
  
  const storeNamespace = io.of('/store');
  storeNamespace.to(`promo_${category}`).emit('new_promotion', {
    category,
    ...promotionData,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📣 Promotion notification sent for category: ${category}`);
};

/**
 * Get user-friendly status message
 * @param {string} status - Status code
 * @returns {string} User-friendly message
 */
function getStatusMessage(status) {
  const messages = {
    'pending': 'Đơn hàng của bạn đang chờ xử lý',
    'confirmed': 'Đơn hàng đã được xác nhận',
    'preparing': 'Đơn hàng đang được chuẩn bị',
    'shipping': 'Đơn hàng đang được vận chuyển',
    'delivered': 'Đơn hàng đã được giao thành công',
    'cancelled': 'Đơn hàng đã bị hủy',
    'returned': 'Đơn hàng đã được hoàn trả'
  };
  
  return messages[status] || 'Trạng thái đơn hàng đã được cập nhật';
}

module.exports = {
  setupStoreSocket,
  notifyOrderStatus,
  notifyPromotion
};
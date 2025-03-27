/**
 * Handler for new order notifications
 * @param {Object} socket - Socket connection
 * @param {Object} data - Order data
 */
const handleNewOrder = (socket, io, data) => {
    try {
      console.log("🛒 Đơn hàng mới được tạo:", data.orderCode);
      
      // Emit to all admin users
      io.emit("newOrderNotification", {
        message: "Có đơn hàng mới",
        orderData: {
          orderCode: data.orderCode,
          total: data.total,
          customerName: data.customerName,
          time: new Date()
        }
      });
      
      // Send acknowledgement back to sender
      socket.emit("orderReceived", { 
        message: "Đơn hàng đã được ghi nhận", 
        orderCode: data.orderCode 
      });
      
    } catch (error) {
      console.error("Error handling new order:", error);
      socket.emit("orderError", { 
        message: "Lỗi khi xử lý đơn hàng", 
        error: error.message 
      });
    }
  };
  
  /**
   * Handler for order status updates
   * @param {Object} socket - Socket connection
   * @param {Object} data - Order status data
   */
  const handleOrderStatusUpdate = (socket, io, data) => {
    try {
      console.log(`📝 Cập nhật trạng thái đơn hàng ${data.orderCode}: ${data.status}`);
      
      // Emit to all connected clients
      io.emit("orderStatusChanged", {
        orderCode: data.orderCode,
        status: data.status,
        updatedAt: new Date()
      });
      
      // Confirm to sender
      socket.emit("statusUpdateConfirmed", {
        message: "Đã cập nhật trạng thái đơn hàng",
        orderCode: data.orderCode,
        status: data.status
      });
      
    } catch (error) {
      console.error("Error updating order status:", error);
      socket.emit("statusUpdateError", { 
        message: "Lỗi khi cập nhật trạng thái đơn hàng", 
        error: error.message 
      });
    }
  };
  
  module.exports = {
    handleNewOrder,
    handleOrderStatusUpdate
  };
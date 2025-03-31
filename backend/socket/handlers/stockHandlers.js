const { ProductSizeStock } = require('../../models/ProductSizeStockmodel');

/**
 * Handler for checking stock levels
 * @param {Object} socket - Socket connection
 */
const handleCheckStock = async (socket) => {
  try {
    console.log("📢 Admin đang kiểm tra tồn kho...");

    // Use the lowStockThreshold from the model instead of hardcoding 5
    const lowStockProducts = await ProductSizeStock.find({
      unlimitedStock: false,
      quantity: { $lte: 5  }
    }).populate([
      { path: 'productId', select: 'tensp' },
      { path: 'dungluongId', select: 'dungluong' },
      { path: 'mausacId', select: 'mausac' }
    ]);

    // Format the products for better display in the frontend
    const formattedProducts = lowStockProducts.map(product => ({
      id: product._id,
      name: product.productId ? product.productId.tensp : 'Unknown Product',
      sku: product.sku,
      quantity: product.quantity,
      capacity: product.dungluongId ? product.dungluongId.dungluong : 'N/A',
      color: product.mausacId ? product.mausacId.mausac : 'N/A',
      threshold: product.lowStockThreshold || 5
    }));

    if (formattedProducts && formattedProducts.length > 0) {
      socket.emit("lowStockAlert", {
        message: "Thông báo cần cập nhật số lượng tồn kho",
        products: formattedProducts,
        count: formattedProducts.length
      });
      console.log(`Sent low stock alert: ${formattedProducts.length} products need restocking`);

      // Update notification status for these products
      // This directly updates the database without requiring a method on the model
      await ProductSizeStock.updateMany(
        { _id: { $in: lowStockProducts.map(product => product._id) } },
        { $set: { notificationSent: true, lastNotificationDate: new Date() } }
      );
    } else {
      socket.emit("stockStatus", {
        message: "Tất cả sản phẩm đều có đủ hàng tồn kho",
        status: "ok"
      });
      console.log("All products have sufficient stock levels");
    }
  } catch (error) {
    console.error("Error fetching stock:", error);
    socket.emit("stockError", {
      message: "Lỗi khi kiểm tra tồn kho",
      error: error.message
    });
  }
};

module.exports = {
  handleCheckStock
};
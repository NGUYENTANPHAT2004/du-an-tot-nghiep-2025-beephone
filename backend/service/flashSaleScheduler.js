// service/flashSaleScheduler.js
const cron = require('node-cron');
const schedule = require('node-schedule'); // Thêm import schedule
const { FlashSale } = require('../models/flashemodel');
const { startFlashSale, endFlashSale } = require('./flashSaleHelper');

// Lưu trữ các ID của Flash Sale đã được lên lịch
const scheduledFlashSaleIds = new Set();

/**
 * Lên lịch cho một Flash Sale cụ thể
 * @param {Object} flashSale - Flash Sale cần lên lịch
 */
const scheduleFlashSale = (flashSale) => {
  const now = new Date();
  const startTime = new Date(flashSale.startTime);
  const endTime = new Date(flashSale.endTime);
  
  // Nếu Flash Sale đã bắt đầu nhưng chưa kết thúc
  if (now >= startTime && now < endTime && flashSale.isActive) {
    console.log(`Flash Sale ${flashSale.name} đã bắt đầu, lên lịch kết thúc`);
    
    // Lên lịch kết thúc
    const job = schedule.scheduleJob(endTime, () => {
      endFlashSale(flashSale._id);
    });
    
    // Lưu lại ID để tránh lập lịch trùng lặp
    scheduledFlashSaleIds.add(flashSale._id.toString());
    
  } 
  // Nếu Flash Sale chưa bắt đầu
  else if (now < startTime) {
    console.log(`Lên lịch bắt đầu cho Flash Sale ${flashSale.name} vào ${startTime}`);
    
    // Lên lịch bắt đầu
    const startJob = schedule.scheduleJob(startTime, () => {
      startFlashSale(flashSale._id);
    });
    
    // Lên lịch kết thúc
    const endJob = schedule.scheduleJob(endTime, () => {
      endFlashSale(flashSale._id);
    });
    
    // Lưu lại ID để tránh lập lịch trùng lặp
    scheduledFlashSaleIds.add(flashSale._id.toString());
  }
};

/**
 * Lên lịch cho tất cả các Flash Sale hiện tại
 * Gọi hàm này khi khởi động server
 */
const scheduleAllFlashSales = async () => {
  try {
    // Lấy tất cả Flash Sale chưa kết thúc và chưa bị xóa
    const flashSales = await FlashSale.find({
      isDeleted: false,
      endTime: { $gt: new Date() }
    });
    
    console.log(`Lên lịch cho ${flashSales.length} Flash Sale`);
    
    // Lên lịch cho từng Flash Sale
    flashSales.forEach(flashSale => {
      scheduleFlashSale(flashSale);
    });
    
    // Thiết lập cron job để kiểm tra các Flash Sale mới hàng giờ
    cron.schedule('0 * * * *', async () => {
      try {
        // Tìm các Flash Sale chưa được lên lịch
        const newFlashSales = await FlashSale.find({
          isDeleted: false,
          endTime: { $gt: new Date() },
          _id: { $nin: Array.from(scheduledFlashSaleIds) }
        });
        
        console.log(`Tìm thấy ${newFlashSales.length} Flash Sale mới cần lên lịch`);
        
        // Lên lịch cho các Flash Sale mới
        newFlashSales.forEach(flashSale => {
          scheduleFlashSale(flashSale);
        });
      } catch (error) {
        console.error('Lỗi khi kiểm tra Flash Sale mới:', error);
      }
    });
    
  } catch (error) {
    console.error('Lỗi khi lên lịch Flash Sale:', error);
  }
};

// Thêm Flash Sale mới vào hệ thống lịch
const scheduleNewFlashSale = (flashSale) => {
  scheduleFlashSale(flashSale);
};

// Xóa lịch cho Flash Sale
const unscheduleFlashSale = (flashSaleId) => {
  // Thực tế sẽ phức tạp hơn, cần lưu trữ các job để có thể hủy
  scheduledFlashSaleIds.delete(flashSaleId.toString());
};

module.exports = {
  scheduleAllFlashSales,
  scheduleNewFlashSale,
  unscheduleFlashSale
};
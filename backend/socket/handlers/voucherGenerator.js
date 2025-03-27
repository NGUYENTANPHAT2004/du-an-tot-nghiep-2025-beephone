// utils/voucherGenerator.js - Enhanced version

const moment = require('moment');
const MaGiamGia = require('../../models/MaGiamGiaModel');
const HoaDon = require('../../models/HoaDonModel');

/**
 * Generates a random voucher for a user
 * @param {string} phone - User phone number
 * @param {string} reason - Reason for voucher generation (first-order, third-order, new-account)
 * @param {number} expiryDays - Number of days until voucher expires
 * @returns {Promise<object>} - Created voucher object
 */
async function generateVoucherForUser(phone, reason = 'reward', expiryDays = 30) {
  try {
    // Define voucher types based on reason
    const voucherTypes = {
      'first-order': {
        prefix: 'FIRST',
        discount: getRandomDiscount(15, 20), // 15-20% discount
        minOrderValue: 100000,
        message: 'Cảm ơn bạn đã mua hàng lần đầu!',
        description: 'Ưu đãi đặc biệt cho đơn hàng đầu tiên của bạn'
      },
      'third-order': {
        prefix: 'LOYAL',
        discount: getRandomDiscount(20, 25), // 20-25% discount
        minOrderValue: 200000,
        message: 'Cảm ơn bạn đã là khách hàng thân thiết!',
        description: 'Ưu đãi dành cho khách hàng trung thành'
      },
      'new-account': {
        prefix: 'WELCOME',
        discount: getRandomDiscount(10, 15), // 10-15% discount
        minOrderValue: 50000,
        message: 'Chào mừng bạn đến với cửa hàng của chúng tôi!',
        description: 'Ưu đãi chào mừng thành viên mới'
      },
      'reward': {
        prefix: 'REWARD',
        discount: getRandomDiscount(10, 20), // 10-20% discount
        minOrderValue: 100000,
        message: 'Mã giảm giá dành riêng cho bạn!',
        description: 'Ưu đãi đặc biệt từ cửa hàng'
      }
    };
    
    // Get voucher type config
    const voucherType = voucherTypes[reason] || voucherTypes.reward;
    
    // Create start and end dates
    const ngaybatdau = moment();
    const ngayketthuc = moment().add(expiryDays, 'days');
    
    // Generate a unique voucher code
    const randomCode = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    const voucherCode = `${voucherType.prefix}-${randomCode}`;
    
    // Check if user already has an active voucher of this type
    const existingVoucher = await MaGiamGia.magiamgia.findOne({
      magiamgia: { $regex: new RegExp(`^${voucherType.prefix}`) },
      ngayketthuc: { $gte: new Date() },
      soluong: { $gt: 0 },
      appliedUsers: { $nin: [phone] }
    });
    
    // If user already has this type of voucher, don't create another one
    if (existingVoucher && reason !== 'reward') {
      console.log(`User ${phone} already has an active ${reason} voucher`);
      return {
        code: existingVoucher.magiamgia,
        discount: existingVoucher.sophantram,
        minOrderValue: existingVoucher.minOrderValue,
        expiresAt: moment(existingVoucher.ngayketthuc).format('DD/MM/YYYY'),
        message: voucherType.message,
        description: voucherType.description,
        isNew: false
      };
    }
    
    // Create the voucher
    const magg = new MaGiamGia.magiamgia({
      magiamgia: voucherCode,
      soluong: 1, // One-time use only
      sophantram: voucherType.discount,
      ngaybatdau: ngaybatdau.toDate(),
      ngayketthuc: ngayketthuc.toDate(),
      minOrderValue: voucherType.minOrderValue,
      maxOrderValue: null, // No upper limit
      isServerWide: false,
      isOneTimePerUser: true,
      appliedUsers: [], // No users have used it yet
      description: voucherType.description
    });
    
    await magg.save();
    
    console.log(`Generated ${reason} voucher ${voucherCode} for user ${phone}`);
    
    return {
      code: magg.magiamgia,
      discount: magg.sophantram,
      minOrderValue: magg.minOrderValue,
      expiresAt: ngayketthuc.format('DD/MM/YYYY'),
      message: voucherType.message,
      description: voucherType.description,
      isNew: true
    };
  } catch (error) {
    console.error('Error generating voucher:', error);
    throw error;
  }
}

/**
 * Checks if a user is eligible for a first order voucher
 * @param {string} phone - User phone number
 * @returns {Promise<boolean>} - True if eligible
 */
async function isFirstOrderVoucherEligible(phone) {
  try {
    // Count previous orders for this user
    const orderCount = await HoaDon.hoadon.countDocuments({ 
      phone, 
      thanhtoan: true // Only count paid orders
    });
    
    // Eligible if this is their first paid order
    return orderCount === 1;
  } catch (error) {
    console.error('Error checking first order eligibility:', error);
    return false;
  }
}

/**
 * Checks if a user is eligible for a third order voucher
 * @param {string} phone - User phone number
 * @returns {Promise<boolean>} - True if eligible
 */
async function isThirdOrderVoucherEligible(phone) {
  try {
    // Count previous orders for this user
    const orderCount = await HoaDon.hoadon.countDocuments({ 
      phone, 
      thanhtoan: true // Only count paid orders
    });
    
    // Eligible if this is their 3rd, 6th, 9th, etc. order (divisible by 3)
    return orderCount > 0 && orderCount % 3 === 0;
  } catch (error) {
    console.error('Error checking third order eligibility:', error);
    return false;
  }
}

/**
 * Generate a random discount percentage within the given range
 * @param {number} min - Minimum discount
 * @param {number} max - Maximum discount
 * @returns {number} - Random discount percentage
 */
function getRandomDiscount(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * Notify user about new vouchers or golden hour events
 * @param {string} phone - User phone number
 * @param {string} type - Notification type (new-voucher, golden-hour)
 * @param {object} data - Additional notification data
 */
async function notifyUserAboutVouchers(phone, type, data = {}) {
  try {
    // This is a placeholder for notification functionality
    // In a real application, this might integrate with a notification service
    console.log(`Notifying user ${phone} about ${type} vouchers:`, data);
    
    // Here you could send push notifications, emails, or update a notifications collection
    
    return true;
  } catch (error) {
    console.error('Error notifying user about vouchers:', error);
    return false;
  }
}

module.exports = {
  generateVoucherForUser,
  isFirstOrderVoucherEligible,
  isThirdOrderVoucherEligible,
  notifyUserAboutVouchers
};
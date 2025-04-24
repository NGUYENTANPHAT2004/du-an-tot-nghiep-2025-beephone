// routes/VoucherValidationRoutes.js
const express = require('express');
const router = express.Router();
const { magiamgia } = require('../models/MaGiamGiaModel');
const { UserPoints } = require('../models/UserPointsModel');
const { RedemptionHistory } = require('../models/RedemptionHistoryModel');
const { VoucherFailure } = require('../models/VoucherFailureModel');
const moment = require('moment');

// Công cụ để kiểm tra xem thời gian hiện tại có trong khung giờ vàng không
function isWithinGoldenHour(goldenHourStart, goldenHourEnd) {
  if (!goldenHourStart || !goldenHourEnd) return true;
  
  const now = moment();
  const currentTime = now.format('HH:mm');
  
  // Xử lý trường hợp khung giờ vàng vượt qua nửa đêm
  if (goldenHourStart <= goldenHourEnd) {
    return currentTime >= goldenHourStart && currentTime <= goldenHourEnd;
  } else {
    return currentTime >= goldenHourStart || currentTime <= goldenHourEnd;
  }
}

// Kiểm tra xem ngày hôm nay có phải ngày được phép không
function isAllowedDayOfWeek(daysOfWeek) {
  if (!daysOfWeek || daysOfWeek.length === 0) return true;
  
  const today = moment().day(); // 0-6, Chủ nhật-Thứ bảy
  return daysOfWeek.includes(today);
}

// Xác thực chi tiết với thông tin lỗi đầy đủ
async function validateVoucherDetailed(voucherCode, phone, totalAmount, userId = null, cartItems = []) {
  if (!voucherCode) return { 
    valid: false, 
    message: 'Không có mã giảm giá',
    reason: 'MISSING_CODE'
  };
  
  console.log(`Đang tìm voucher với mã: ${voucherCode}`);
  
  // Tìm kiếm với $regex để không phân biệt hoa thường
  // FIX: Sửa lại truy vấn để tìm theo trường magiamgia thay vì voucherCode
  const voucher = await magiamgia.findOne({
    magiamgia: { $regex: new RegExp(`^${voucherCode}$`, 'i') },
    isDeleted: { $ne: true } // Không tìm voucher đã xóa
  });
  
  if (!voucher) {
    console.log(`Không tìm thấy mã giảm giá: ${voucherCode}`);
    
    // Log để gỡ lỗi
    const allVouchers = await magiamgia.find({}).limit(5);
    console.log('Ví dụ 5 mã giảm giá hiện có:', allVouchers.map(v => v.magiamgia));
    
    return { 
      valid: false, 
      message: 'Mã giảm giá không tồn tại',
      reason: 'INVALID_CODE'
    };
  }
  
  // Kiểm tra ngày hết hạn
  const ngayHienTai = moment();
  const ngayKetThuc = moment(voucher.ngayketthuc);
  const ngayBatDau = moment(voucher.ngaybatdau);
  
  if (ngayHienTai.isAfter(ngayKetThuc) || ngayHienTai.isBefore(ngayBatDau)) {
    return { 
      valid: false, 
      message: 'Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng',
      reason: 'TIME_CONSTRAINT',
      details: {
        current: ngayHienTai.format('YYYY-MM-DD HH:mm:ss'),
        start: ngayBatDau.format('YYYY-MM-DD HH:mm:ss'),
        end: ngayKetThuc.format('YYYY-MM-DD HH:mm:ss')
      }
    };
  }
  
  // Kiểm tra số lượng khả dụng
  if (voucher.soluong <= 0) {
    return { 
      valid: false, 
      message: 'Mã giảm giá đã hết lượt sử dụng',
      reason: 'OUT_OF_STOCK'
    };
  }
  
  // Kiểm tra giá trị đơn hàng tối thiểu
  if (totalAmount < voucher.minOrderValue) {
    return { 
      valid: false, 
      message: `Giá trị đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString('vi-VN')}đ`,
      reason: 'BELOW_MIN_ORDER',
      details: {
        required: voucher.minOrderValue,
        current: totalAmount,
        shortfall: voucher.minOrderValue - totalAmount
      }
    };
  }
  
  // Kiểm tra giá trị đơn hàng tối đa
  if (voucher.maxOrderValue && totalAmount > voucher.maxOrderValue) {
    return { 
      valid: false, 
      message: `Giá trị đơn hàng không được vượt quá ${voucher.maxOrderValue.toLocaleString('vi-VN')}đ`,
      reason: 'EXCEEDS_MAX_ORDER',
      details: {
        allowed: voucher.maxOrderValue,
        current: totalAmount,
        excess: totalAmount - voucher.maxOrderValue
      }
    };
  }
  
  // Kiểm tra khung giờ vàng
  if (voucher.goldenHourStart && voucher.goldenHourEnd) {
    if (!isWithinGoldenHour(voucher.goldenHourStart, voucher.goldenHourEnd)) {
      return { 
        valid: false, 
        message: `Mã giảm giá chỉ có hiệu lực trong khung giờ vàng: ${voucher.goldenHourStart} - ${voucher.goldenHourEnd}`,
        reason: 'OUTSIDE_GOLDEN_HOUR',
        details: {
          current: moment().format('HH:mm'),
          start: voucher.goldenHourStart,
          end: voucher.goldenHourEnd
        }
      };
    }
  }
  
  // Kiểm tra giới hạn ngày trong tuần
  if (voucher.daysOfWeek && voucher.daysOfWeek.length > 0) {
    if (!isAllowedDayOfWeek(voucher.daysOfWeek)) {
      const allowedDays = voucher.daysOfWeek
        .map(day => ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][day])
        .join(', ');
      
      return { 
        valid: false, 
        message: `Mã giảm giá chỉ có hiệu lực vào: ${allowedDays}`,
        reason: 'INVALID_DAY',
        details: {
          current: moment().day(),
          allowed: voucher.daysOfWeek
        }
      };
    }
  }
  
  // Kiểm tra các ràng buộc về người dùng
  if (!voucher.isServerWide) {
    // Kiểm tra quyền sở hữu voucher
    if (voucher.userId && userId && voucher.userId.toString() !== userId.toString()) {
      return { 
        valid: false, 
        message: 'Mã giảm giá này không thuộc về bạn',
        reason: 'NOT_OWNER'
      };
    }
    
    // Kiểm tra xem voucher có dành cho người dùng cụ thể không
    if (voucher.intended_users && voucher.intended_users.length > 0) {
      const userMatch = userId ? 
        voucher.intended_users.some(id => id && id.toString() === userId.toString()) :
        voucher.intended_users.includes(phone);
      
      if (!userMatch) {
        return { 
          valid: false, 
          message: 'Mã giảm giá không dành cho tài khoản này',
          reason: 'NOT_INTENDED_USER'
        };
      }
    }
    
    // Kiểm tra ràng buộc sử dụng một lần
// Kiểm tra ràng buộc sử dụng một lần
if (voucher.isOneTimePerUser) {
  const userApplied = userId ? 
    voucher.appliedUsers.some(id => id.toString() === userId.toString()) :
    voucher.appliedUsers.includes(phone);
  
  if (userApplied) {
    return { 
      valid: false, 
      message: 'Bạn đã sử dụng mã giảm giá này',
      reason: 'ALREADY_USED'
    };
  }
}
  }
  
  // Tất cả kiểm tra đã qua, voucher hợp lệ
  console.log(`Voucher ${voucherCode} hợp lệ. Discount: ${voucher.sophantram}%`);
  return { 
    valid: true, 
    message: 'Mã giảm giá hợp lệ',
    voucher: voucher,
    discountPercent: voucher.sophantram,
    discountAmount: Math.floor(totalAmount * voucher.sophantram / 100),
    finalPrice: totalAmount - Math.floor(totalAmount * voucher.sophantram / 100)
  };
}

// Lưu lỗi sử dụng voucher
async function logVoucherFailure(failureData) {
  try {
    const voucherFailure = new VoucherFailure(failureData);
    await voucherFailure.save();
    return voucherFailure;
  } catch (error) {
    console.error('Lỗi khi lưu thông tin lỗi voucher:', error);
    return null;
  }
}

// Cập nhật bản ghi lỗi
async function updateVoucherFailureLog(voucherCode, updateData) {
  try {
    const result = await VoucherFailure.findOneAndUpdate(
      { voucherCode },
      updateData,
      { sort: { timestamp: -1 }, new: true }
    );
    return result;
  } catch (error) {
    console.error('Lỗi cập nhật log lỗi voucher:', error);
    return null;
  }
}

// Hoàn điểm cho người dùng
async function processPointRefund(redemptionRecord) {
  try {
    if (!redemptionRecord) {
      console.error('Missing redemption record for refund');
      return false;
    }

    // Tìm bản ghi điểm của người dùng
    const userPoints = await UserPoints.findOne({
      $or: [
        { userId: redemptionRecord.userId },
        { phone: redemptionRecord.phone },
        { email: redemptionRecord.email }
      ]
    });
    
    if (!userPoints) {
      console.error('Could not find user points record for refund');
      return false;
    }
    
    // Cộng điểm lại vào tài khoản của người dùng
    userPoints.availablePoints += redemptionRecord.pointsSpent;
    
    // Ghi lại trong lịch sử
    userPoints.pointsHistory.push({
      amount: redemptionRecord.pointsSpent,
      type: 'adjusted',
      voucherId: redemptionRecord.voucherId,
      reason: `Hoàn điểm từ phiếu ${redemptionRecord.voucherCode} không áp dụng được`,
      date: new Date()
    });
    
    userPoints.lastUpdated = new Date();
    await userPoints.save();
    
    // Cập nhật trạng thái đổi điểm
    redemptionRecord.status = 'cancelled';
    await redemptionRecord.save();
    
    // Cập nhật log lỗi nếu có
    const failureLog = await VoucherFailure.findOne({ 
      voucherCode: redemptionRecord.voucherCode 
    }).sort({ timestamp: -1 });
    
    if (failureLog) {
      failureLog.refundProcess = 'completed';
      failureLog.refundAmount = redemptionRecord.pointsSpent;
      failureLog.refundDate = new Date();
      await failureLog.save();
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi khi hoàn điểm:', error);
    return false;
  }
}

// API: Xác thực sớm voucher (trước khi thanh toán)
router.post('/pre-validate-voucher', async (req, res) => {
  try {
    // FIX: Trực tiếp gán tham số magiamgia cho voucherCode
    const { magiamgia: voucherCode, orderTotal, userId, phone, cartItems } = req.body;
    
    console.log('Nhận yêu cầu xác thực voucher:', {
      voucherCode,
      orderTotal,
      userId: userId ? userId.substring(0, 5) + '...' : 'none',
      phone: phone ? phone.substring(0, 5) + '...' : 'none'
    });
    
    if (!voucherCode) {
      return res.json({
        valid: false,
        message: 'Vui lòng nhập mã giảm giá'
      });
    }
    
    // Kiểm tra xem đây có phải là voucher đổi điểm không
    const isLoyaltyRedeemed = voucherCode.startsWith('REWARD-');
    let loyaltyInfo = null;
    
    if (isLoyaltyRedeemed) {
      const redemptionRecord = await RedemptionHistory.findOne({
        voucherCode: voucherCode,
        status: 'active'
      });
      
      if (redemptionRecord) {
        loyaltyInfo = {
          pointsSpent: redemptionRecord.pointsSpent,
          redemptionDate: redemptionRecord.redemptionDate
        };
      }
    }
    
    // Xác thực tiêu chuẩn
    const validationResult = await validateVoucherDetailed(voucherCode, phone, orderTotal, userId, cartItems);
    
    // Thêm thông tin điểm thưởng vào phản hồi
    const response = {
      ...validationResult,
      isLoyaltyRedeemed,
      loyaltyInfo
    };
    
    console.log('Kết quả xác thực voucher:', {
      valid: response.valid,
      message: response.message
    });
    
    return res.json(response);
  } catch (error) {
    console.error('Lỗi xác thực trước voucher:', error);
    res.status(500).json({
      valid: false,
      message: 'Lỗi khi kiểm tra mã giảm giá',
      error: error.message
    });
  }
});

// API: Xác thực với khả năng hoàn điểm
router.post('/validatevoucher-with-refund', async (req, res) => {
  try {
    // FIX: Trực tiếp gán tham số magiamgia cho voucherCode
    const { magiamgia: voucherCode, phone, orderTotal, userId } = req.body;
    
    // Xác thực tiêu chuẩn
    const validationResult = await validateVoucherDetailed(voucherCode, phone, orderTotal, userId);
    
    if (!validationResult.valid) {
      // Kiểm tra xem đây có phải là voucher đổi điểm không
      const redemptionRecord = await RedemptionHistory.findOne({
        voucherCode: voucherCode,
        status: 'active'
      });
      
      if (redemptionRecord) {
        // Ghi nhận lỗi xác thực
        const failureLog = {
          voucherCode: voucherCode,
          userId: userId || null,
          phone: phone || null,
          redemptionId: redemptionRecord._id,
          orderTotal: orderTotal,
          reason: validationResult.reason || validationResult.message,
          reasonDetails: validationResult.details || {},
          timestamp: new Date(),
          refundProcess: 'initiated'
        };
        
        // Tạo bản ghi lỗi voucher
        await logVoucherFailure(failureLog);
        
        // Bắt đầu quy trình hoàn điểm
        const refundResult = await processPointRefund(redemptionRecord);
        
        return res.json({
          valid: false,
          message: validationResult.message,
          pointsRefunded: refundResult,
          refundAmount: redemptionRecord.pointsSpent,
          reason: validationResult.reason || 'VALIDATION_FAILED'
        });
      }
    }
    
    // Đối với voucher hợp lệ hoặc không phải voucher điểm thưởng, trả về phản hồi thông thường
    return res.json(validationResult);
  } catch (error) {
    console.error('Lỗi khi xác thực voucher với hoàn điểm:', error);
    res.status(500).json({
      valid: false,
      message: 'Lỗi khi kiểm tra mã giảm giá',
      error: error.message
    });
  }
});

// API: Kiểm tra xem voucher có phải từ điểm thưởng không
router.get('/check-loyalty-voucher/:voucherCode', async (req, res) => {
  try {
    const { voucherCode } = req.params;
    
    const redemptionRecord = await RedemptionHistory.findOne({
      voucherCode: voucherCode,
      status: 'active'
    });
    
    res.json({
      isLoyaltyVoucher: !!redemptionRecord,
      redemptionInfo: redemptionRecord ? {
        pointsSpent: redemptionRecord.pointsSpent,
        redemptionId: redemptionRecord.redemptionId,
        userId: redemptionRecord.userId,
        phone: redemptionRecord.phone
      } : null
    });
  } catch (error) {
    console.error('Lỗi kiểm tra voucher điểm thưởng:', error);
    res.status(500).json({
      isLoyaltyVoucher: false,
      error: error.message
    });
  }
});

// API cho gỡ lỗi - thêm để dễ kiểm tra vấn đề
router.post('/debug-voucher', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Tìm kiếm정확히
    const exactMatch = await magiamgia.findOne({ magiamgia: code });
    
    // Tìm kiếm không phân biệt hoa thường
    const caseInsensitiveMatch = await magiamgia.findOne({
      magiamgia: { $regex: new RegExp(`^${code}$`, 'i') }
    });
    
    // Tìm kiếm tương tự
    const similarMatches = await magiamgia.find({
      magiamgia: { $regex: new RegExp(code, 'i') }
    }).limit(5);
    
    // Lấy 10 mã gần đây
    const recentVouchers = await magiamgia.find({})
      .sort({ ngaybatdau: -1 })
      .limit(10);
    
    res.json({
      searched: code,
      exactMatch: !!exactMatch,
      caseInsensitiveMatch: !!caseInsensitiveMatch,
      exactMatchDetails: exactMatch,
      similarMatches: similarMatches.map(v => v.magiamgia),
      recentVouchers: recentVouchers.map(v => v.magiamgia)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Các API Admin khác giữ nguyên...
module.exports = router;
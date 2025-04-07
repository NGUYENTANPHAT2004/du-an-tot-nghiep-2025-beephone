const express = require('express');
const router = express.Router();
const { UserPoints } = require('../models/UserPointsModel');
const { PointsRedemption } = require('../models/PointsRedemptionModel');
const { RedemptionHistory } = require('../models/RedemptionHistoryModel');
const { User } = require('../models/user.model');
const { magiamgia } = require('../models/MaGiamGiaModel');

// Middleware để kiểm tra user và tạo bản ghi điểm thưởng nếu cần
const ensureUserPoints = async (req, res, next) => {
  try {
    const { userId, phone, email } = req.body;
    
    if (!userId && !phone && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId, email hoặc số điện thoại là bắt buộc' 
      });
    }
    
    let query = {};
    if (userId) query.userId = userId;
    else if (phone) query.phone = phone;
    else if (email) query.email = email;
    
    let userPoints = await UserPoints.findOne(query);
    
    if (!userPoints) {
      // Lấy thông tin người dùng từ User model nếu có userId/email
      let userData = null;
      if (userId) {
        userData = await User.User.findById(userId);
      } else if (email) {
        userData = await User.User.findOne({ email });
      }
      
      // Áp dụng thông tin từ user data nếu có
      const userPhone = phone || (userData ? userData.phone : null);
      const userEmail = email || (userData ? userData.email : null);
      const userUserId = userId || (userData ? userData._id : null);
      
      // Kiểm tra xem có đủ thông tin để tạo bản ghi không
      if (!userPhone) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xác định số điện thoại người dùng'
        });
      }
      
      // Tạo bản ghi điểm mới
      userPoints = new UserPoints({
        userId: userUserId,
        phone: userPhone,
        email: userEmail,
        totalPoints: 0,
        availablePoints: 0,
        tier: 'standard',
        yearToDatePoints: 0,
        pointsHistory: [],
        expiringPoints: []
      });
      
      await userPoints.save();
    }
    
    req.userPoints = userPoints;
    next();
  } catch (error) {
    console.error('Lỗi trong middleware ensureUserPoints:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi xử lý thông tin điểm thưởng' 
    });
  }
};

// Tính toán cấp thành viên dựa trên điểm YTD
const calculateUserTier = (yearToDatePoints) => {
  if (yearToDatePoints >= 10000) return 'platinum';
  if (yearToDatePoints >= 5000) return 'gold';
  if (yearToDatePoints >= 2000) return 'silver';
  return 'standard';
};

// 1. Lấy điểm của người dùng
router.get('/loyalty/user-points/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Kiểm tra xem identifier là một ObjectId (userId) hay số điện thoại
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    let query = {};
    if (isObjectId) {
      query.userId = identifier;
    } else {
      query.phone = identifier;
    }
    
    const userPoints = await UserPoints.findOne(query);
    
    if (!userPoints) {
      return res.status(200).json({
        success: true,
        hasPoints: false,
        points: {
          totalPoints: 0,
          availablePoints: 0,
          tier: 'standard',
          yearToDatePoints: 0
        }
      });
    }
    
    res.json({
      success: true,
      hasPoints: true,
      points: {
        totalPoints: userPoints.totalPoints,
        availablePoints: userPoints.availablePoints,
        tier: userPoints.tier,
        yearToDatePoints: userPoints.yearToDatePoints,
        history: userPoints.pointsHistory.slice(0, 10) // Trả về 10 lịch sử gần đây nhất
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy điểm người dùng:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thông tin điểm thưởng' 
    });
  }
});

// 2. Tích điểm sau khi đặt hàng thành công
router.post('/loyalty/award-points', async (req, res) => {
  try {
    const { 
      userId, 
      phone, 
      orderId, 
      orderAmount,
      orderDate
    } = req.body;
    
    if (!orderId || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin đơn hàng hoặc giá trị đơn hàng'
      });
    }
    
    // Tìm hoặc tạo bản ghi điểm của người dùng
    let query = {};
    if (userId) query.userId = userId;
    else if (phone) query.phone = phone;
    else {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người dùng'
      });
    }
    
    let userPoints = await UserPoints.findOne(query);
    
    // Nếu không có bản ghi điểm, tạo mới
    if (!userPoints) {
      userPoints = new UserPoints({
        userId,
        phone,
        totalPoints: 0,
        availablePoints: 0,
        tier: 'standard',
        yearToDatePoints: 0,
        pointsHistory: [],
        expiringPoints: []
      });
    }
    
    // Kiểm tra xem đã tích điểm cho đơn hàng này chưa
    const alreadyAwarded = userPoints.pointsHistory.some(
      entry => entry.orderId && entry.orderId.toString() === orderId.toString() && entry.type === 'earned'
    );
    
    if (alreadyAwarded) {
      return res.status(400).json({
        success: false,
        message: 'Điểm thưởng đã được cộng cho đơn hàng này'
      });
    }
    
    // Tính điểm (1 điểm cho mỗi 1000đ)
    const pointsEarned = Math.floor(orderAmount / 1000);
    
    // Thêm điểm với hạn sử dụng 1 năm
    const expiryDate = orderDate ? 
      new Date(new Date(orderDate).setFullYear(new Date(orderDate).getFullYear() + 1)) : 
      new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    
    userPoints.totalPoints += pointsEarned;
    userPoints.availablePoints += pointsEarned;
    userPoints.yearToDatePoints += pointsEarned;
    
    // Thêm vào điểm sắp hết hạn
    userPoints.expiringPoints.push({
      points: pointsEarned,
      expiryDate
    });
    
    // Thêm vào lịch sử
    userPoints.pointsHistory.push({
      amount: pointsEarned,
      type: 'earned',
      orderId,
      reason: `Điểm thưởng từ đơn hàng #${orderId}`,
      date: orderDate || new Date()
    });
    
    // Cập nhật cấp thành viên
    userPoints.tier = calculateUserTier(userPoints.yearToDatePoints);
    
    await userPoints.save();
    
    res.json({
      success: true,
      message: `Đã cộng ${pointsEarned} điểm thưởng cho đơn hàng`,
      pointsEarned,
      newPointsTotal: userPoints.availablePoints,
      tier: userPoints.tier
    });
  } catch (error) {
    console.error('Lỗi khi tích điểm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cộng điểm thưởng'
    });
  }
});

// 3. Đổi điểm lấy voucher
router.post('/loyalty/redeem', ensureUserPoints, async (req, res) => {
  try {
    const { redemptionId } = req.body;
    const userPoints = req.userPoints;
    
    if (!redemptionId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin quà đổi điểm'
      });
    }
    
    // Lấy thông tin lựa chọn đổi điểm
    const redemptionOption = await PointsRedemption.findById(redemptionId)
      .populate('voucherId', 'magiamgia sophantram ngaybatdau ngayketthuc minOrderValue maxOrderValue');
    
    if (!redemptionOption) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quà đổi điểm'
      });
    }
    
    // Kiểm tra xem người dùng có đủ điểm không
    if (userPoints.availablePoints < redemptionOption.pointsCost) {
      return res.status(400).json({
        success: false,
        message: `Bạn cần ${redemptionOption.pointsCost} điểm để đổi quà này. Hiện bạn chỉ có ${userPoints.availablePoints} điểm khả dụng.`
      });
    }
    
    // Lấy thông tin mã giảm giá
    const voucher = await magiamgia.findById(redemptionOption.voucherId);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá liên kết'
      });
    }
    
    // Cập nhật mã giảm giá để thêm người dùng vào danh sách người dùng dự định
    if (!voucher.intended_users) {
      voucher.intended_users = [];
    }
    
    if (!voucher.intended_users.includes(userPoints.phone)) {
      voucher.intended_users.push(userPoints.phone);
      await voucher.save();
    }
    
    // Tạo bản ghi lịch sử đổi điểm
    const redemptionHistory = new RedemptionHistory({
      userId: userPoints.userId,
      phone: userPoints.phone,
      redemptionId: redemptionOption._id,
      voucherId: voucher._id,
      pointsSpent: redemptionOption.pointsCost,
      voucherCode: voucher.magiamgia,
      expiryDate: voucher.ngayketthuc,
      status: 'active'
    });
    
    await redemptionHistory.save();
    
    // Trừ điểm từ tài khoản người dùng
    userPoints.availablePoints -= redemptionOption.pointsCost;
    
    // Thêm vào lịch sử
    userPoints.pointsHistory.push({
      amount: -redemptionOption.pointsCost,
      type: 'redeemed',
      voucherId: voucher._id,
      reason: `Đổi ${redemptionOption.pointsCost} điểm lấy ${redemptionOption.name}`,
      date: new Date()
    });
    
    await userPoints.save();
    
    res.json({
      success: true,
      message: 'Đổi điểm thành công',
      voucher: {
        code: voucher.magiamgia,
        name: redemptionOption.name,
        description: redemptionOption.description,
        value: redemptionOption.voucherValue,
        type: redemptionOption.voucherType,
        minOrderValue: redemptionOption.minOrderValue || voucher.minOrderValue,
        expiryDate: voucher.ngayketthuc,
        pointsUsed: redemptionOption.pointsCost
      },
      remainingPoints: userPoints.availablePoints
    });
  } catch (error) {
    console.error('Lỗi khi đổi điểm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đổi điểm thưởng'
    });
  }
});

module.exports = router;
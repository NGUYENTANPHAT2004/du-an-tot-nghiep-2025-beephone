// Fixed LoyaltyPointsRoutes.js - User ID Only for points management
const express = require('express');
const router = express.Router();
const { UserPoints } = require('../models/UserPointsModel');
const { PointsRedemption } = require('../models/PointsRedemptionModel');
const { RedemptionHistory } = require('../models/RedemptionHistoryModel');
const { User } = require('../models/user.model');
const { magiamgia } = require('../models/MaGiamGiaModel');
const moment = require('moment');
const db = require('../models/db')
// Middleware to ensure user points exist - USER ID ONLY
const ensureUserPoints = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId là bắt buộc để quản lý điểm thưởng' 
      });
    }
    
    // Check if user ID is valid MongoDB ObjectID
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        success: false, 
        message: 'UserId không hợp lệ'
      });
    }
    
    // Only search by userId
    let userPoints = await UserPoints.findOne({ userId });
    
    if (!userPoints) {
      // Get user information from User model
      const userData = await User.findById(userId);
      
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        });
      }
      
      // Create new points record with user ID only as the primary identifier
      userPoints = new UserPoints({
        userId, // Primary identifier
        phone: userData.phone, // Store for reference but don't use for lookups
        email: userData.email, // Store for reference but don't use for lookups
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

// 1. Lấy điểm của người dùng - CHỈ DÙNG USER ID
router.get('/loyalty/user-points/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kiểm tra định dạng ObjectId hợp lệ
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId không hợp lệ'
      });
    }
    
    // Chỉ tìm theo userId
    const userPoints = await UserPoints.findOne({ userId });
    
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
    
    // Kiểm tra điểm sắp hết hạn trong 30 ngày tới
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const soonExpiringPoints = userPoints.expiringPoints
      .filter(entry => entry.expiryDate <= thirtyDaysFromNow && entry.expiryDate > now)
      .reduce((total, entry) => total + entry.points, 0);
    
    function getNextTier(currentTier) {
      const tiers = {
        'standard': 'silver',
        'silver': 'gold',
        'gold': 'platinum'
      };
      return tiers[currentTier] || null;
    }

    function getPointsToNextTier(currentTier, yearToDatePoints) {
      const tierThresholds = {
        'standard': 2000,  // Cần 2000 để đạt Silver
        'silver': 5000,    // Cần 5000 để đạt Gold
        'gold': 10000      // Cần 10000 để đạt Platinum
      };
      
      const threshold = tierThresholds[currentTier] || 0;
      return Math.max(0, threshold - yearToDatePoints);
    }
    
    res.json({
      success: true,
      hasPoints: true,
      points: {
        totalPoints: userPoints.totalPoints,
        availablePoints: userPoints.availablePoints,
        tier: userPoints.tier,
        yearToDatePoints: userPoints.yearToDatePoints,
        soonExpiringPoints,
        nextTier: userPoints.tier !== 'platinum' ? getNextTier(userPoints.tier) : null,
        pointsToNextTier: userPoints.tier !== 'platinum' ? getPointsToNextTier(userPoints.tier, userPoints.yearToDatePoints) : 0,
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

// 2. Tích điểm sau khi đặt hàng thành công - CHỈ DÙNG USER ID
router.post('/loyalty/award-points', async (req, res) => {
  try {
    const { 
      userId,
      orderId, 
      orderAmount,
      orderDate
    } = req.body;
    
    if (!userId || !orderId || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết (userId, orderId, orderAmount)'
      });
    }
    
    // Kiểm tra định dạng ObjectId hợp lệ
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId không hợp lệ'
      });
    }
    
    // Tìm hoặc tạo bản ghi điểm của người dùng - CHỈ DÙNG USER ID
    let userPoints = await UserPoints.findOne({ userId });
    
    // Nếu không có bản ghi điểm, tạo mới
    if (!userPoints) {
      const userData = await User.findById(userId);
      
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        });
      }
      
      userPoints = new UserPoints({
        userId,
        phone: userData.phone, // Chỉ lưu trữ để tham khảo
        email: userData.email, // Chỉ lưu trữ để tham khảo
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
    
    userPoints.lastUpdated = new Date();
    
    // Tính lại cấp thành viên dựa trên điểm YTD
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

// 3. Lấy danh sách các voucher có thể đổi điểm - CHỈ DÙNG USER ID
router.get('/loyalty/redemption-options', async (req, res) => {
  try {
    const { tier, userId } = req.query;
    
    // Lấy cấp thành viên của người dùng nếu không được cung cấp nhưng có userId
    let userTier = tier;
    if (!userTier && userId) {
      const userPoints = await UserPoints.findOne({ userId });
      if (userPoints) {
        userTier = userPoints.tier;
      } else {
        userTier = 'standard';
      }
    }
    
    // Mặc định là cấp standard nếu không được chỉ định
    if (!userTier) userTier = 'standard';
    
    const now = new Date();
    
    // Tìm các lựa chọn đổi điểm có sẵn cho cấp thành viên của người dùng
    const redemptionOptions = await PointsRedemption.find({
      isActive: true,
      remainingQuantity: { $gt: 0 },
      startDate: { $lte: now },
      endDate: { $gt: now },
      $or: [
        { availableTiers: { $in: [userTier] } },
        { availableTiers: { $size: 0 } } // Có sẵn cho tất cả các cấp nếu trống
      ]
    })
    .populate('voucherId', 'magiamgia sophantram ngaybatdau ngayketthuc')
    .sort({ pointsCost: 1 });
    
    // Kiểm tra xem người dùng đã đổi những voucher nào nếu có userId
    let redeemedVouchers = [];
    if (userId) {
      redeemedVouchers = await RedemptionHistory.find({
        userId,
        status: { $in: ['active', 'used'] }
      }).distinct('redemptionId');
    }
    
    // Thêm thông tin đã đổi vào kết quả
    const formattedOptions = redemptionOptions.map(option => {
      const isRedeemed = redeemedVouchers.some(id => 
        id.toString() === option._id.toString()
      );
      
      return {
        ...option.toObject(),
        isRedeemed,
        canRedeem: !isRedeemed || option.limitPerUser > 1
      };
    });
    
    res.json({
      success: true,
      tier: userTier,
      redemptionOptions: formattedOptions
    });
  } catch (error) {
    console.error('Lỗi khi lấy tùy chọn đổi điểm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin quà đổi điểm'
    });
  }
});

// 4. Đổi điểm lấy voucher - CHỈ DÙNG USER ID
router.post('/loyalty/redeem', ensureUserPoints, async (req, res) => {
  const session = await db.mongoose.startSession();
  session.startTransaction();
  
  try {
    const { redemptionId } = req.body;
    const userPoints = req.userPoints;
    
    if (!redemptionId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin quà đổi điểm'
      });
    }
    
    // Tìm thông tin phần thưởng đổi điểm - PHẢI ĐẶT TẠI ĐÂY
    const redemptionOption = await PointsRedemption.findById(redemptionId)
      .populate('voucherId', 'sophantram ngaybatdau ngayketthuc minOrderValue maxOrderValue')
      .session(session);
    
    if (!redemptionOption) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quà đổi điểm'
      });
    }
    
    // Kiểm tra xem lựa chọn còn hoạt động không
    if (!redemptionOption.isActive || redemptionOption.remainingQuantity <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Quà đổi điểm không còn khả dụng'
      });
    }
    
    // Kiểm tra ngày hợp lệ
    const now = new Date();
    if (now < redemptionOption.startDate || now > redemptionOption.endDate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Quà đổi điểm không trong thời gian khả dụng'
      });
    }
    
    // Kiểm tra cấp thành viên
    if (redemptionOption.availableTiers.length > 0 && 
        !redemptionOption.availableTiers.includes(userPoints.tier)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: `Quà đổi điểm chỉ dành cho hạng ${redemptionOption.availableTiers.join(', ')}`
      });
    }
    
    // Kiểm tra số điểm
    if (userPoints.availablePoints < redemptionOption.pointsCost) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Bạn cần ${redemptionOption.pointsCost} điểm để đổi quà này. Hiện bạn chỉ có ${userPoints.availablePoints} điểm khả dụng.`
      });
    }
    
    // Kiểm tra giới hạn đổi điểm
    const userRedemptionCount = await RedemptionHistory.countDocuments({
      userId: userPoints.userId,
      redemptionId: redemptionOption._id,
      status: { $in: ['active', 'used'] }
    }).session(session);
    
    if (userRedemptionCount >= redemptionOption.limitPerUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Bạn đã đạt giới hạn đổi quà ${redemptionOption.limitPerUser} lần cho ưu đãi này`
      });
    }
    
    // Lấy thông tin voucher mẫu - FIX CASTING ERROR
    let voucherId;
    if (typeof redemptionOption.voucherId === 'object' && redemptionOption.voucherId !== null) {
      // Nếu đã populate thành object, lấy _id từ object đó
      voucherId = redemptionOption.voucherId._id;
    } else {
      // Nếu chỉ là ID
      voucherId = redemptionOption.voucherId;
    }
    
    const templateVoucher = await magiamgia.findById(voucherId).session(session);
    
    if (!templateVoucher) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá liên kết'
      });
    }
    
    // Tạo mã giảm giá mới và riêng cho người dùng này
    const voucherCode = `Points-${userPoints.userId.toString().slice(-4)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Đặt thời gian hết hạn từ voucher mẫu hoặc mặc định 30 ngày
    const expiryDate = templateVoucher.ngayketthuc ? 
      new Date(templateVoucher.ngayketthuc) : 
      new Date(new Date().setDate(new Date().getDate() + 30));
    
    // Tạo bản ghi mã giảm giá mới trong bảng magiamgia
    const newVoucher = new magiamgia({
      magiamgia: voucherCode,
      soluong: 1, // Một lần sử dụng
      sophantram: redemptionOption.voucherValue, // Lấy từ quà đổi điểm
      ngaybatdau: new Date(),
      ngayketthuc: expiryDate,
      minOrderValue: templateVoucher.minOrderValue || 0,
      maxOrderValue: templateVoucher.maxOrderValue || null,
      isServerWide: false,
      isOneTimePerUser: true,
      userId: userPoints.userId, // Gán mã này cho user cụ thể
      intended_users: [userPoints.userId] // Chỉ user này mới được dùng
    });
    
    await newVoucher.save({ session });
    
    // Tạo bản ghi lịch sử đổi điểm
    const redemptionHistory = new RedemptionHistory({
      userId: userPoints.userId,
      phone: userPoints.phone,
      email: userPoints.email,
      redemptionId: redemptionOption._id,
      voucherId: newVoucher._id, // Lưu ID của voucher mới tạo
      pointsSpent: redemptionOption.pointsCost,
      voucherCode: voucherCode,
      redemptionDate: new Date(),
      expiryDate: expiryDate,
      status: 'active'
    });
    
    // Cập nhật điểm người dùng - trừ điểm đã dùng
    userPoints.availablePoints -= redemptionOption.pointsCost;
    
    // Thêm vào lịch sử điểm
    userPoints.pointsHistory.push({
      amount: -redemptionOption.pointsCost,
      type: 'redeemed',
      voucherId: newVoucher._id,
      reason: `Đổi điểm lấy "${redemptionOption.name}"`,
      date: new Date()
    });
    
    userPoints.lastUpdated = new Date();
    
    // Giảm số lượng còn lại của quà đổi điểm
    redemptionOption.remainingQuantity -= 1;
    
    await redemptionHistory.save({ session });
    await userPoints.save({ session });
    await redemptionOption.save({ session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    res.json({
      success: true,
      message: 'Đổi điểm thành công',
      voucher: {
        code: voucherCode,
        type: redemptionOption.voucherType,
        value: redemptionOption.voucherValue,
        minOrderValue: templateVoucher.minOrderValue || 0,
        expiryDate: expiryDate,
        pointsUsed: redemptionOption.pointsCost
      },
      remainingPoints: userPoints.availablePoints
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Lỗi khi đổi điểm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đổi điểm thưởng'
    });
  }
});

// 5. Lấy lịch sử đổi điểm của người dùng - CHỈ DÙNG USER ID
router.get('/loyalty/redemption-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kiểm tra định dạng ObjectId hợp lệ
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId không hợp lệ'
      });
    }
    
    const redemptionHistory = await RedemptionHistory.find({ userId })
      .sort({ redemptionDate: -1 })
      .populate('redemptionId', 'name description voucherType voucherValue')
      .populate('voucherId', 'magiamgia sophantram minOrderValue ngayketthuc')
      .lean();
    
    // Format lại kết quả để dễ sử dụng
    const formattedHistory = redemptionHistory.map(item => ({
      _id: item._id,
      voucherCode: item.voucherCode,
      voucherName: item.redemptionId?.name || 'Phần thưởng đã xóa',
      voucherDescription: item.redemptionId?.description || '',
      discountType: item.redemptionId?.voucherType || 'percentage',
      discountValue: item.redemptionId?.voucherValue || 0,
      minOrderValue: item.voucherId?.minOrderValue || 0,
      pointsSpent: item.pointsSpent,
      redemptionDate: item.redemptionDate,
      expiryDate: item.expiryDate,
      status: item.status,
      usedDate: item.usedDate
    }));
    
    res.json({
      success: true,
      history: formattedHistory
    });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử đổi điểm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử đổi điểm'
    });
  }
});

module.exports = router;
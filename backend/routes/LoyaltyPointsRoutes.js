const express = require('express');
const router = express.Router();
const { UserPoints } = require('../models/UserPointsModel');
const { PointsRedemption } = require('../models/PointsRedemptionModel');
const { RedemptionHistory } = require('../models/RedemptionHistoryModel');
const { User } = require('../models/user.model');
const { magiamgia } = require('../models/MaGiamGiaModel');
const moment = require('moment');

// Middleware để kiểm tra user và tạo bản ghi điểm thưởng nếu cần
// Middleware để kiểm tra user và tạo bản ghi điểm thưởng nếu cần
const ensureUserPoints = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId là bắt buộc để quản lý điểm thưởng' 
      });
    }
    
    let userPoints = await UserPoints.findOne({ userId });
    
    if (!userPoints) {
      // Lấy thông tin người dùng từ User model
      const userData = await User.User.findById(userId);
      
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        });
      }
      
      // Tạo bản ghi điểm mới với userId
      userPoints = new UserPoints({
        userId,
        phone: userData.phone,
        email: userData.email,
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
// Cập nhật route GET /loyalty/redemption-history/:identifier trong LoyaltyPointsRoutes.js
router.get('/loyalty/redemption-history/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Kiểm tra xem identifier là gì (ObjectId, email hay số điện thoại)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    
    let query = {};
    if (isObjectId) {
      query.userId = identifier;
    } else if (isEmail) {
      query.email = identifier;
    } else {
      query.phone = identifier;
    }
    
    const redemptionHistory = await RedemptionHistory.find(query)
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

// Helper functions for tier calculation
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

// 2. Tích điểm sau khi đặt hàng thành công
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
    
    // Tìm hoặc tạo bản ghi điểm của người dùng
    let userPoints = await UserPoints.findOne({ userId });
    
    // Nếu không có bản ghi điểm, tạo mới
    if (!userPoints) {
      const userData = await User.User.findById(userId);
      
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        });
      }
      
      userPoints = new UserPoints({
        userId,
        phone: userData.phone,
        email: userData.email,
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

// 3. Lấy danh sách các voucher có thể đổi điểm
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
router.post('/loyalty/combine-points', async (req, res) => {
  try {
    const { targetPhone, sourcePhone, sourceEmail, userId } = req.body;
    
    if (!targetPhone || (!sourcePhone && !sourceEmail && !userId)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin tài khoản nguồn hoặc đích'
      });
    }
    
    // Tìm tài khoản đích
    const targetAccount = await UserPoints.findOne({ phone: targetPhone });
    if (!targetAccount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản đích'
      });
    }
    
    // Tìm tài khoản nguồn
    let sourceQuery = {};
    if (sourcePhone) sourceQuery.phone = sourcePhone;
    else if (sourceEmail) sourceQuery.email = sourceEmail;
    else if (userId) sourceQuery.userId = userId;
    
    const sourceAccount = await UserPoints.findOne(sourceQuery);
    if (!sourceAccount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản nguồn'
      });
    }
    
    // Đảm bảo hai tài khoản không trùng nhau
    if (sourceAccount._id.toString() === targetAccount._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể kết hợp điểm với cùng một tài khoản'
      });
    }
    
    // Chuyển điểm từ tài khoản nguồn sang tài khoản đích
    const pointsToTransfer = sourceAccount.availablePoints;
    
    // Cập nhật điểm cho tài khoản đích
    targetAccount.totalPoints += pointsToTransfer;
    targetAccount.availablePoints += pointsToTransfer;
    targetAccount.yearToDatePoints += pointsToTransfer;
    
    // Thêm vào lịch sử
    targetAccount.pointsHistory.push({
      amount: pointsToTransfer,
      type: 'adjusted',
      reason: `Kết hợp điểm từ tài khoản ${sourceAccount.phone || sourceAccount.email}`,
      date: new Date()
    });
    
    // Chuyển các điểm sắp hết hạn
    sourceAccount.expiringPoints.forEach(entry => {
      targetAccount.expiringPoints.push({
        points: entry.points,
        expiryDate: entry.expiryDate
      });
    });
    
    // Cập nhật cấp thành viên
    targetAccount.tier = calculateUserTier(targetAccount.yearToDatePoints);
    targetAccount.lastUpdated = new Date();
    
    // Xóa điểm trên tài khoản nguồn
    sourceAccount.totalPoints = 0;
    sourceAccount.availablePoints = 0;
    sourceAccount.expiringPoints = [];
    sourceAccount.pointsHistory.push({
      amount: -pointsToTransfer,
      type: 'adjusted',
      reason: `Đã chuyển điểm đến tài khoản ${targetAccount.phone}`,
      date: new Date()
    });
    sourceAccount.lastUpdated = new Date();
    
    // Lưu thay đổi
    await Promise.all([targetAccount.save(), sourceAccount.save()]);
    
    res.json({
      success: true,
      message: `Đã chuyển ${pointsToTransfer} điểm thành công`,
      targetAccount: {
        phone: targetAccount.phone,
        newTotal: targetAccount.availablePoints,
        tier: targetAccount.tier
      }
    });
    
  } catch (error) {
    console.error('Lỗi khi kết hợp điểm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kết hợp điểm thưởng'
    });
  }
});

// 4. Đổi điểm lấy voucher
// Cập nhật route POST /loyalty/redeem trong LoyaltyPointsRoutes.js
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
    
    // Kiểm tra xem lựa chọn còn hoạt động không
    if (!redemptionOption.isActive || redemptionOption.remainingQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quà đổi điểm không còn khả dụng'
      });
    }
    
    // Kiểm tra xem ngày hiện tại có nằm trong thời gian đổi điểm không
    const now = new Date();
    if (now < redemptionOption.startDate || now > redemptionOption.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Quà đổi điểm không trong thời gian khả dụng'
      });
    }
    
    // Kiểm tra tính đủ điều kiện của cấp thành viên
    if (redemptionOption.availableTiers.length > 0 && 
        !redemptionOption.availableTiers.includes(userPoints.tier)) {
      return res.status(403).json({
        success: false,
        message: `Quà đổi điểm chỉ dành cho hạng ${redemptionOption.availableTiers.join(', ')}`
      });
    }
    
    // Kiểm tra xem người dùng có đủ điểm không
    if (userPoints.availablePoints < redemptionOption.pointsCost) {
      return res.status(400).json({
        success: false,
        message: `Bạn cần ${redemptionOption.pointsCost} điểm để đổi quà này. Hiện bạn chỉ có ${userPoints.availablePoints} điểm khả dụng.`
      });
    }
    
    // Kiểm tra giới hạn đổi điểm cho mỗi người dùng
    const userRedemptionCount = await RedemptionHistory.countDocuments({
      userId: userPoints.userId,
      redemptionId: redemptionOption._id,
      status: { $in: ['active', 'used'] }
    });
    
    if (userRedemptionCount >= redemptionOption.limitPerUser) {
      return res.status(400).json({
        success: false,
        message: `Bạn đã đạt giới hạn đổi quà ${redemptionOption.limitPerUser} lần cho ưu đãi này`
      });
    }
    
    // ... Phần còn lại của mã giữ nguyên
    // Cập nhật mã giảm giá, tạo bản ghi lịch sử, trừ điểm người dùng, etc.
  } catch (error) {
    console.error('Lỗi khi đổi điểm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đổi điểm thưởng'
    });
  }
});

// 5. Lấy lịch sử đổi điểm của người dùng
// Cập nhật route GET /loyalty/redemption-history/:identifier trong LoyaltyPointsRoutes.js
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

// 6. ADMIN: Tạo tùy chọn đổi điểm mới (kết nối với mã giảm giá có sẵn)

// 8. Đặt lại điểm YTD cho tính toán cấp thành viên (chạy hàng năm)
module.exports = router;
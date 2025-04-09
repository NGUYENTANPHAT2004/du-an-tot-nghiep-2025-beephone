const express = require('express');
const router = express.Router();
const { UserPoints } = require('../models/UserPointsModel');
const { PointsRedemption } = require('../models/PointsRedemptionModel');
const { RedemptionHistory } = require('../models/RedemptionHistoryModel');
const { User } = require('../models/user.model');
const { magiamgia } = require('../models/MaGiamGiaModel');
const moment = require('moment');

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
    const { tier, phone } = req.query;
    
    // Lấy cấp thành viên của người dùng nếu không được cung cấp nhưng có số điện thoại
    let userTier = tier;
    if (!userTier && phone) {
      const userPoints = await UserPoints.findOne({ phone });
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
    
    // Kiểm tra xem người dùng đã đổi những voucher nào nếu có số điện thoại
    let redeemedVouchers = [];
    if (phone) {
      redeemedVouchers = await RedemptionHistory.find({
        phone,
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
router.get('/loyalty/user-points-by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }
    
    const userPoints = await UserPoints.findOne({ email });
    
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
    console.error('Lỗi khi lấy điểm người dùng qua email:', error);
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
    
    // Kiểm tra mã giảm giá liên kết
    if (!redemptionOption.voucherId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá liên kết với quà đổi điểm này'
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
    
    // Cập nhật số lượng lựa chọn đổi điểm còn lại
    redemptionOption.remainingQuantity -= 1;
    await redemptionOption.save();
    
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
    
    // Trừ điểm từ tài khoản người dùng (FIFO - sử dụng điểm cũ nhất trước)
    userPoints.availablePoints -= redemptionOption.pointsCost;
    
    // Thêm vào lịch sử
    userPoints.pointsHistory.push({
      amount: -redemptionOption.pointsCost,
      type: 'redeemed',
      voucherId: voucher._id,
      reason: `Đổi ${redemptionOption.pointsCost} điểm lấy ${redemptionOption.name}`,
      date: new Date()
    });
    
    // Trừ từ điểm sắp hết hạn (cũ nhất trước)
    let pointsToDeduct = redemptionOption.pointsCost;
    userPoints.expiringPoints.sort((a, b) => a.expiryDate - b.expiryDate);
    
    for (let i = 0; i < userPoints.expiringPoints.length; i++) {
      if (pointsToDeduct <= 0) break;
      
      const entry = userPoints.expiringPoints[i];
      if (entry.points <= pointsToDeduct) {
        pointsToDeduct -= entry.points;
        entry.points = 0;
      } else {
        entry.points -= pointsToDeduct;
        pointsToDeduct = 0;
      }
    }
    
    // Xóa các mục có 0 điểm
    userPoints.expiringPoints = userPoints.expiringPoints.filter(entry => entry.points > 0);
    
    userPoints.lastUpdated = new Date();
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

// 5. Lấy lịch sử đổi điểm của người dùng
router.get('/loyalty/redemption-history/:identifier', async (req, res) => {
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

// 6. ADMIN: Tạo tùy chọn đổi điểm mới (kết nối với mã giảm giá có sẵn)
router.post('/admin/loyalty/create-redemption', async (req, res) => {
  try {
    const {
      name,
      description,
      pointsCost,
      voucherType,
      voucherValue,
      voucherId, // ID của mã giảm giá có sẵn
      minOrderValue,
      availableTiers,
      limitPerUser,
      totalQuantity,
      startDate,
      endDate,
      imageUrl
    } = req.body;
    
    // Xác thực các trường bắt buộc
    if (!name || !pointsCost || !voucherType || !voucherValue || !voucherId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }
    
    // Kiểm tra mã giảm giá có tồn tại không
    const voucher = await magiamgia.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }
    
    const redemptionOption = new PointsRedemption({
      name,
      description,
      pointsCost,
      voucherType,
      voucherValue,
      voucherId,
      minOrderValue: minOrderValue || voucher.minOrderValue || 0,
      availableTiers: availableTiers || [],
      limitPerUser: limitPerUser || 1,
      totalQuantity: totalQuantity || 100,
      remainingQuantity: totalQuantity || 100,
      startDate: startDate || new Date(),
      endDate: endDate || voucher.ngayketthuc || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      imageUrl
    });
    
    await redemptionOption.save();
    
    res.json({
      success: true,
      message: 'Tạo quà đổi điểm thành công',
      redemptionOption
    });
  } catch (error) {
    console.error('Lỗi khi tạo tùy chọn đổi điểm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo quà đổi điểm'
    });
  }
});

// 7. ADMIN: Xử lý điểm sắp hết hạn (có thể chạy bằng một tác vụ đã lên lịch)
router.post('/admin/loyalty/process-expiring-points', async (req, res) => {
  try {
    const now = new Date();
    
    // Tìm tất cả người dùng có điểm sắp hết hạn
    const usersWithExpiringPoints = await UserPoints.find({
      'expiringPoints.expiryDate': { $lt: now }
    });
    
    let totalUsersProcessed = 0;
    let totalPointsExpired = 0;
    
    for (const user of usersWithExpiringPoints) {
      let pointsExpired = 0;
      
      // Lọc các điểm đã hết hạn
      const expiredEntries = user.expiringPoints.filter(entry => entry.expiryDate < now);
      const validEntries = user.expiringPoints.filter(entry => entry.expiryDate >= now);
      
      // Tính tổng điểm đã hết hạn
      expiredEntries.forEach(entry => {
        pointsExpired += entry.points;
      });
      
      // Chỉ cập nhật nếu thực sự có điểm đã hết hạn
      if (pointsExpired > 0) {
        // Cập nhật bản ghi người dùng
        user.expiringPoints = validEntries;
        user.availablePoints -= pointsExpired;
        
        // Thêm vào lịch sử
        user.pointsHistory.push({
          amount: -pointsExpired,
          type: 'expired',
          reason: 'Điểm hết hạn sử dụng',
          date: now
        });
        
        user.lastUpdated = now;
        await user.save();
        
        totalUsersProcessed++;
        totalPointsExpired += pointsExpired;
      }
    }
    
    res.json({
      success: true,
      message: `Đã xử lý ${totalPointsExpired} điểm hết hạn cho ${totalUsersProcessed} người dùng`
    });
  } catch (error) {
    console.error('Lỗi khi xử lý điểm hết hạn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý điểm hết hạn'
    });
  }
});

// 8. Đặt lại điểm YTD cho tính toán cấp thành viên (chạy hàng năm)
router.post('/admin/loyalty/reset-ytd-points', async (req, res) => {
  try {
    // Lấy tất cả người dùng có điểm YTD
    const users = await UserPoints.find({ yearToDatePoints: { $gt: 0 } });
    
    // Với mỗi người dùng, lưu cấp thành viên hiện tại và đặt lại điểm YTD
    let updated = 0;
    for (const user of users) {
      // Lưu cấp thành viên hiện tại
      const currentTier = user.tier;
      
      // Đặt lại điểm YTD
      user.yearToDatePoints = 0;
      
      // Thêm vào lịch sử
      user.pointsHistory.push({
        amount: 0,
        type: 'adjusted',
        reason: 'Đặt lại điểm thưởng hàng năm. Duy trì hạng thành viên ' + currentTier,
        date: new Date()
      });
      
      user.lastUpdated = new Date();
      await user.save();
      updated++;
    }
    
    res.json({
      success: true,
      message: `Đã đặt lại điểm thưởng hàng năm cho ${updated} thành viên`
    });
  } catch (error) {
    console.error('Lỗi khi đặt lại điểm YTD:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt lại điểm thưởng hàng năm'
    });
  }
});

// 9. ADMIN: Lấy thống kê chương trình thành viên
router.get('/admin/loyalty/stats', async (req, res) => {
  try {
    // Lấy tổng số người dùng có điểm
    const totalUsers = await UserPoints.countDocuments();
    
    // Lấy tổng điểm đã phát hành
    const pointsStats = await UserPoints.aggregate([
      {
        $group: {
          _id: null,
          totalPointsIssued: { $sum: '$totalPoints' },
          totalPointsAvailable: { $sum: '$availablePoints' },
          tierCounts: {
            $push: { tier: '$tier' }
          }
        }
      }
    ]);
    
    // Tính phân phối cấp thành viên
    const tierDistribution = {
      standard: 0,
      silver: 0,
      gold: 0,
      platinum: 0
    };
    
    if (pointsStats.length > 0 && pointsStats[0].tierCounts) {
      pointsStats[0].tierCounts.forEach(item => {
        tierDistribution[item.tier] = tierDistribution[item.tier] + 1 || 1;
      });
    }
    
    // Lấy thống kê đổi điểm
    const redemptionStats = await RedemptionHistory.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          pointsSpent: { $sum: '$pointsSpent' }
        }
      }
    ]);
    
    // Chuyển đổi thống kê đổi điểm
    const formattedRedemptionStats = {
      total: 0,
      active: 0,
      used: 0,
      expired: 0,
      totalPointsRedeemed: 0
    };
    
    redemptionStats.forEach(stat => {
      formattedRedemptionStats[stat._id] = stat.count;
      formattedRedemptionStats.total += stat.count;
      formattedRedemptionStats.totalPointsRedeemed += stat.pointsSpent;
    });
    
    // Lấy các tùy chọn đổi điểm hàng đầu
    const topRedemptions = await RedemptionHistory.aggregate([
      {
        $group: {
          _id: '$redemptionId',
          count: { $sum: 1 },
          pointsSpent: { $sum: '$pointsSpent' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'pointsredemptions',
          localField: '_id',
          foreignField: '_id',
          as: 'redemptionInfo'
        }
      },
      {
        $unwind: '$redemptionInfo'
      },
      {
        $project: {
          _id: 1,
          name: '$redemptionInfo.name',
          count: 1,
          pointsSpent: 1,
          voucherType: '$redemptionInfo.voucherType',
          voucherValue: '$redemptionInfo.voucherValue'
        }
      }
    ]);
    
    res.json({
      success: true,
      totalUsers,
      pointsStats: pointsStats.length > 0 ? {
        totalPointsIssued: pointsStats[0].totalPointsIssued,
        totalPointsAvailable: pointsStats[0].totalPointsAvailable,
        pointsRedeemed: formattedRedemptionStats.totalPointsRedeemed,
        pointsExpiredOrAdjusted: pointsStats[0].totalPointsIssued - 
                                 pointsStats[0].totalPointsAvailable - 
                                 formattedRedemptionStats.totalPointsRedeemed
      } : {
        totalPointsIssued: 0,
        totalPointsAvailable: 0,
        pointsRedeemed: 0,
        pointsExpiredOrAdjusted: 0
      },
      tierDistribution,
      redemptionStats: formattedRedemptionStats,
      topRedemptions
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê chương trình thành viên'
    });
  }
});

// 10. Điều chỉnh điểm thủ công (ADMIN)
router.post('/admin/loyalty/adjust-points', async (req, res) => {
  try {
    const { userId, phone, pointsAdjustment, reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp lý do điều chỉnh điểm'
      });
    }
    
    if (!pointsAdjustment) {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp số điểm điều chỉnh'
      });
    }
    
    let query = {};
    if (userId) query.userId = userId;
    else if (phone) query.phone = phone;
    else {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp ID người dùng hoặc số điện thoại'
      });
    }
    
    const userPoints = await UserPoints.findOne(query);
    
    if (!userPoints) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin điểm của người dùng'
      });
    }
    
    // Cập nhật điểm
    userPoints.totalPoints += pointsAdjustment;
    userPoints.availablePoints += pointsAdjustment;
    
    // Nếu điểm được thêm, cũng cập nhật YTD và có thể là cấp thành viên
    if (pointsAdjustment > 0) {
      userPoints.yearToDatePoints += pointsAdjustment;
      
      // Thêm vào điểm sắp hết hạn với thời hạn 1 năm
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      userPoints.expiringPoints.push({
        points: pointsAdjustment,
        expiryDate
      });
      
      // Tính lại cấp thành viên
      userPoints.tier = calculateUserTier(userPoints.yearToDatePoints);
    } else if (pointsAdjustment < 0) {
      // Nếu điểm bị trừ, xóa từ điểm sắp hết hạn (cũ nhất trước)
      let pointsToDeduct = Math.abs(pointsAdjustment);
      userPoints.expiringPoints.sort((a, b) => a.expiryDate - b.expiryDate);
      
      for (let i = 0; i < userPoints.expiringPoints.length; i++) {
        if (pointsToDeduct <= 0) break;
        
        const entry = userPoints.expiringPoints[i];
        if (entry.points <= pointsToDeduct) {
          pointsToDeduct -= entry.points;
          entry.points = 0;
        } else {
          entry.points -= pointsToDeduct;
          pointsToDeduct = 0;
        }
      }
      
      // Xóa các mục có 0 điểm
      userPoints.expiringPoints = userPoints.expiringPoints.filter(entry => entry.points > 0);
    }
    
    // Thêm vào lịch sử
    userPoints.pointsHistory.push({
      amount: pointsAdjustment,
      type: 'adjusted',
      reason: reason,
      date: new Date()
    });
    
    userPoints.lastUpdated = new Date();
    await userPoints.save();
    
    res.json({
      success: true,
      message: `Đã điều chỉnh ${pointsAdjustment} điểm cho người dùng`,
      newPointsTotal: userPoints.availablePoints,
      tier: userPoints.tier
    });
  } catch (error) {
    console.error('Lỗi khi điều chỉnh điểm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi điều chỉnh điểm thưởng'
    });
  }
});
module.exports = router;
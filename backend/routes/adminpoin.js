// routes/AdminLoyaltyRoutes.js - Backend routes for admin points management

const express = require('express');
const router = express.Router();
const { UserPoints } = require('../models/UserPointsModel');
const { PointsRedemption } = require('../models/PointsRedemptionModel');
const { RedemptionHistory } = require('../models/RedemptionHistoryModel');
const { User } = require('../models/user.model');
const { magiamgia } = require('../models/MaGiamGiaModel');
const moment = require('moment');

// Middleware to check admin authorization
const checkAdminAuth = async (req, res, next) => {
  try {
    // Here you would typically check if the user is authenticated and has admin role
    // This is a simplified version - in a real application, you'd check JWT tokens, etc.
    
    // For demonstration purposes, we're skipping actual auth check
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Không có quyền truy cập' 
    });
  }
};

// Get all users with points accounts
router.get('/admin/loyalty/users', checkAdminAuth, async (req, res) => {
  try {
    const users = await UserPoints.find()
      .sort({ lastUpdated: -1 })
      .limit(100);
    
    // Map để đảm bảo mỗi bản ghi có userId
    const mappedUsers = await Promise.all(users.map(async (user) => {
      const userData = user.toObject();
      
      // Nếu không có userId nhưng có phone/email, tìm user tương ứng
      if (!userData.userId && (userData.phone || userData.email)) {
        try {
          let query = {};
          if (userData.phone) query.phone = userData.phone;
          else if (userData.email) query.email = userData.email;
          
          const matchedUser = await User.User.findOne(query);
          if (matchedUser) {
            userData.userId = matchedUser._id;
            
            // Cập nhật vào database
            await UserPoints.findByIdAndUpdate(user._id, { userId: matchedUser._id });
          }
        } catch (err) {
          console.error('Error mapping userId:', err);
        }
      }
      
      return userData;
    }));
    
    res.json({
      success: true,
      data: mappedUsers
    });
  } catch (error) {
    console.error('Error fetching users with points:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách thành viên'
    });
  }
});

// Get points history for a specific user
router.get('/admin/loyalty/user-points-history/:userId', checkAdminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userPoints = await UserPoints.findById(userId);
    
    if (!userPoints) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản điểm thưởng'
      });
    }
    
    // Get history sorted from newest to oldest
    const history = userPoints.pointsHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching user points history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch sử điểm thưởng'
    });
  }
});

// Get all redemption options for admin
router.get('/admin/loyalty/redemption-options', checkAdminAuth, async (req, res) => {
  try {
    const options = await PointsRedemption.find()
      .populate('voucherId', 'magiamgia sophantram ngaybatdau ngayketthuc')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Error fetching redemption options:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách tùy chọn đổi điểm'
    });
  }
});

// Create a new redemption option
router.post('/admin/loyalty/create-redemption', checkAdminAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      pointsCost,
      voucherType,
      voucherValue,
      voucherId,
      minOrderValue,
      availableTiers,
      limitPerUser,
      totalQuantity,
      startDate,
      endDate,
      imageUrl
    } = req.body;
    
    // Validate required fields
    if (!name || !pointsCost || !voucherType || !voucherValue || !voucherId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }
    
    // Check if voucher exists
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
      pointsCost: Number(pointsCost),
      voucherType,
      voucherValue: Number(voucherValue),
      voucherId,
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      availableTiers: availableTiers || [],
      limitPerUser: limitPerUser ? Number(limitPerUser) : 1,
      totalQuantity: totalQuantity ? Number(totalQuantity) : 100,
      remainingQuantity: totalQuantity ? Number(totalQuantity) : 100,
      startDate: startDate || new Date(),
      endDate: endDate || voucher.ngayketthuc || moment().add(1, 'year').toDate(),
      imageUrl
    });
    
    await redemptionOption.save();
    
    res.json({
      success: true,
      message: 'Tạo quà đổi điểm thành công',
      data: redemptionOption
    });
  } catch (error) {
    console.error('Error creating redemption option:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tùy chọn đổi điểm'
    });
  }
});

// Update an existing redemption option
router.put('/admin/loyalty/update-redemption/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      pointsCost,
      voucherType,
      voucherValue,
      voucherId,
      minOrderValue,
      availableTiers,
      limitPerUser,
      totalQuantity,
      startDate,
      endDate,
      imageUrl
    } = req.body;
    
    // Validate required fields
    if (!name || !pointsCost || !voucherType || !voucherValue || !voucherId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }
    
    // Find the redemption option
    const redemptionOption = await PointsRedemption.findById(id);
    if (!redemptionOption) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tùy chọn đổi điểm'
      });
    }
    
    // Check if voucher exists
    const voucher = await magiamgia.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }
    
    // Update fields
    redemptionOption.name = name;
    redemptionOption.description = description;
    redemptionOption.pointsCost = Number(pointsCost);
    redemptionOption.voucherType = voucherType;
    redemptionOption.voucherValue = Number(voucherValue);
    redemptionOption.voucherId = voucherId;
    redemptionOption.minOrderValue = minOrderValue ? Number(minOrderValue) : 0;
    redemptionOption.availableTiers = availableTiers || [];
    redemptionOption.limitPerUser = limitPerUser ? Number(limitPerUser) : 1;
    redemptionOption.totalQuantity = totalQuantity ? Number(totalQuantity) : 100;
    
    // Only update remaining quantity if total quantity has changed
    if (totalQuantity !== redemptionOption.totalQuantity) {
      const redeemed = redemptionOption.totalQuantity - redemptionOption.remainingQuantity;
      redemptionOption.remainingQuantity = Math.max(0, totalQuantity - redeemed);
    }
    
    redemptionOption.startDate = startDate || redemptionOption.startDate;
    redemptionOption.endDate = endDate || redemptionOption.endDate;
    redemptionOption.imageUrl = imageUrl;
    redemptionOption.updatedAt = new Date();
    
    await redemptionOption.save();
    
    res.json({
      success: true,
      message: 'Cập nhật tùy chọn đổi điểm thành công',
      data: redemptionOption
    });
  } catch (error) {
    console.error('Error updating redemption option:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật tùy chọn đổi điểm'
    });
  }
});

// Delete a redemption option
router.delete('/admin/loyalty/delete-redemption/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await PointsRedemption.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tùy chọn đổi điểm'
      });
    }
    
    res.json({
      success: true,
      message: 'Xóa tùy chọn đổi điểm thành công'
    });
  } catch (error) {
    console.error('Error deleting redemption option:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tùy chọn đổi điểm'
    });
  }
});

// Toggle redemption option active status
router.patch('/admin/loyalty/toggle-redemption/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin trạng thái'
      });
    }
    
    const redemptionOption = await PointsRedemption.findById(id);
    
    if (!redemptionOption) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tùy chọn đổi điểm'
      });
    }
    
    redemptionOption.isActive = isActive;
    redemptionOption.updatedAt = new Date();
    
    await redemptionOption.save();
    
    res.json({
      success: true,
      message: `Đã ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} tùy chọn đổi điểm`,
      data: redemptionOption
    });
  } catch (error) {
    console.error('Error toggling redemption option status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái tùy chọn đổi điểm'
    });
  }
});

// Get loyalty statistics for admin dashboard
router.get('/admin/loyalty/stats', checkAdminAuth, async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await UserPoints.countDocuments();
    
    // Get points statistics
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
    
    // Calculate tier distribution
    const tierDistribution = {
      standard: 0,
      silver: 0,
      gold: 0,
      platinum: 0
    };
    
    if (pointsStats.length > 0 && pointsStats[0].tierCounts) {
      pointsStats[0].tierCounts.forEach(item => {
        if (tierDistribution[item.tier] !== undefined) {
          tierDistribution[item.tier]++;
        }
      });
    }
    
    // Get redemption statistics
    const redemptionStats = await RedemptionHistory.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          pointsSpent: { $sum: '$pointsSpent' }
        }
      }
    ]);
    
    // Format redemption statistics
    const formattedRedemptionStats = {
      total: 0,
      active: 0,
      used: 0,
      expired: 0,
      totalPointsRedeemed: 0
    };
    
    redemptionStats.forEach(stat => {
      if (formattedRedemptionStats[stat._id] !== undefined) {
        formattedRedemptionStats[stat._id] = stat.count;
        formattedRedemptionStats.total += stat.count;
        formattedRedemptionStats.totalPointsRedeemed += stat.pointsSpent;
      }
    });
    
    // Get top redemption options
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
    
    // Get points history over time (by month)
    const sixMonthsAgo = moment().subtract(6, 'months').startOf('month').toDate();
    
    const pointsHistory = await UserPoints.aggregate([
      { 
        $unwind: '$pointsHistory' 
      },
      {
        $match: {
          'pointsHistory.date': { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$pointsHistory.date' },
            month: { $month: '$pointsHistory.date' }
          },
          pointsIssued: {
            $sum: {
              $cond: [
                { $gt: ['$pointsHistory.amount', 0] },
                '$pointsHistory.amount',
                0
              ]
            }
          },
          pointsRedeemed: {
            $sum: {
              $cond: [
                { $lt: ['$pointsHistory.amount', 0] },
                { $abs: '$pointsHistory.amount' },
                0
              ]
            }
          }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: 1
            }
          },
          pointsIssued: 1,
          pointsRedeemed: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
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
        topRedemptions,
        pointsHistory
      }
    });
  } catch (error) {
    console.error('Error fetching loyalty stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thống kê điểm thưởng'
    });
  }
});

// Get date-filtered stats
router.get('/admin/loyalty/stats-by-date', checkAdminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin khoảng thời gian'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);
    
    // Similar query structure as the general stats, but filtered by date
    // This is simplified for the demonstration - would need to be adapted based on requirements
    
    const dateFilteredStats = await UserPoints.aggregate([
      {
        $unwind: '$pointsHistory'
      },
      {
        $match: {
          'pointsHistory.date': { 
            $gte: start, 
            $lte: end 
          }
        }
      },
      {
        $group: {
          _id: null,
          pointsIssued: {
            $sum: {
              $cond: [
                { $gt: ['$pointsHistory.amount', 0] },
                '$pointsHistory.amount',
                0
              ]
            }
          },
          pointsRedeemed: {
            $sum: {
              $cond: [
                { $lt: ['$pointsHistory.amount', 0] },
                { $abs: '$pointsHistory.amount' },
                0
              ]
            }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        dateRange: {
          startDate,
          endDate
        },
        stats: dateFilteredStats.length > 0 ? dateFilteredStats[0] : {
          pointsIssued: 0,
          pointsRedeemed: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching date-filtered stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thống kê theo khoảng thời gian'
    });
  }
});

// Process expired points (batch job that can be triggered by admin)
router.post('/admin/loyalty/process-expiring-points', checkAdminAuth, async (req, res) => {
  try {
    const now = new Date();
    
    // Find all users with expiring points
    const usersWithExpiringPoints = await UserPoints.find({
      'expiringPoints.expiryDate': { $lt: now }
    });
    
    let totalUsersProcessed = 0;
    let totalPointsExpired = 0;
    
    for (const user of usersWithExpiringPoints) {
      let pointsExpired = 0;
      
      // Filter expired points entries
      const expiredEntries = user.expiringPoints.filter(entry => entry.expiryDate < now);
      const validEntries = user.expiringPoints.filter(entry => entry.expiryDate >= now);
      
      // Calculate total expired points
      expiredEntries.forEach(entry => {
        pointsExpired += entry.points;
      });
      
      // Only update if there are actually expired points
      if (pointsExpired > 0) {
        // Update user record
        user.expiringPoints = validEntries;
        user.availablePoints -= pointsExpired;
        
        // Add to history
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
    console.error('Error processing expired points:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý điểm hết hạn'
    });
  }
});

// Reset Year-to-Date points (for tier calculation) - typically run yearly
router.post('/admin/loyalty/reset-ytd-points', checkAdminAuth, async (req, res) => {
  try {
    // Find all users with YTD points
    const users = await UserPoints.find({ yearToDatePoints: { $gt: 0 } });
    
    // For each user, preserve current tier but reset YTD points
    let updated = 0;
    for (const user of users) {
      // Save current tier
      const currentTier = user.tier;
      
      // Reset YTD points
      user.yearToDatePoints = 0;
      
      // Add to history
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
    console.error('Error resetting YTD points:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt lại điểm thưởng hàng năm'
    });
  }
});
router.get('/admin/loyalty/search', checkAdminAuth, async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term || term.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Cần ít nhất 2 ký tự để tìm kiếm'
      });
    }
    
    // Tìm kiếm user theo tên hoặc email
    const users = await User.User.find({
      $or: [
        { username: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } }
      ]
    }).select('_id username email phone').limit(20);
    
    // Nếu không tìm thấy người dùng
    if (users.length === 0) {
      return res.json({
        success: true,
        data: [],
        userDetails: []
      });
    }
    
    // Lấy ra danh sách userId và phone để tìm trong UserPoints
    const userIds = users.map(user => user._id);
    const phones = users.map(user => user.phone).filter(Boolean);
    const emails = users.map(user => user.email).filter(Boolean);
    
    // Tìm kiếm trong UserPoints
    const userPointsQuery = {
      $or: [
        { userId: { $in: userIds } },
        { phone: { $in: phones } },
        { email: { $in: emails } }
      ]
    };
    
    const pointsAccounts = await UserPoints.find(userPointsQuery);
    
    // Nếu không tìm thấy tài khoản điểm
    if (pointsAccounts.length === 0) {
      return res.json({
        success: true,
        data: [],
        userDetails: []
      });
    }
    
    // Trả về kết quả
    res.json({
      success: true,
      data: pointsAccounts,
      userDetails: users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm người dùng'
    });
  }
});
router.get('/admin/loyalty/user-points/:userId', checkAdminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kiểm tra định dạng ObjectId hợp lệ
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'UserId không hợp lệ'
      });
    }
    
    // Tìm theo trường userId hoặc _id
    const userPoints = await UserPoints.findOne({
      $or: [
        { userId: userId },
        { _id: userId }
      ]
    });
    
    if (!userPoints) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản điểm thưởng'
      });
    }
    
    res.json({
      success: true,
      data: userPoints
    });
  } catch (error) {
    console.error('Error fetching user points:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thông tin điểm thưởng'
    });
  }
});

// Sửa lại API lấy lịch sử điểm
router.get('/admin/loyalty/user-points-history/:userId', checkAdminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userPoints = await UserPoints.findOne({
      $or: [
        { userId: userId },
        { _id: userId }
      ]
    });
    
    if (!userPoints) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản điểm thưởng'
      });
    }
    
    // Get history sorted from newest to oldest
    const history = userPoints.pointsHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching user points history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch sử điểm thưởng'
    });
  }
});
module.exports = router;
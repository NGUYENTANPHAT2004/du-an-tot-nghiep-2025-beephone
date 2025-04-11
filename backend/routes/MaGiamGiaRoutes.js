const express = require("express");
const router = express.Router();
const MaGiamGia = require("../models/MaGiamGiaModel");
const moment = require("moment");

// Utility function to check if current time is within golden hour
function isWithinGoldenHour(goldenHourStart, goldenHourEnd) {
  if (!goldenHourStart || !goldenHourEnd) return true;

  const now = moment();
  const currentTime = now.format("HH:mm");

  // Handle cases where golden hour crosses midnight
  if (goldenHourStart <= goldenHourEnd) {
    return currentTime >= goldenHourStart && currentTime <= goldenHourEnd;
  } else {
    return currentTime >= goldenHourStart || currentTime <= goldenHourEnd;
  }
}

// Utility function to check if today is an allowed day of week
function isAllowedDayOfWeek(daysOfWeek) {
  if (!daysOfWeek || daysOfWeek.length === 0) return true;

  const today = moment().day(); // 0-6, Sunday-Saturday
  return daysOfWeek.includes(today);
}

// Helper function to get voucher prefix
function getVoucherPrefix(code) {
  if (!code) return "OTHER";

  if (code.startsWith("FIRST")) return "FIRST";
  if (code.startsWith("LOYAL")) return "LOYAL";
  if (code.startsWith("WELCOME")) return "WELCOME";
  if (code.startsWith("SW")) return "SW";
  if (code.startsWith("REWARD")) return "REWARD";
  return "OTHER";
}

// Helper function to get voucher type label
function getVoucherTypeLabel(code) {
  if (!code) return "Mã giảm giá";

  if (code.startsWith("FIRST")) return "Khách hàng mới";
  if (code.startsWith("LOYAL")) return "Khách hàng thân thiết";
  if (code.startsWith("WELCOME")) return "Chào mừng";
  if (code.startsWith("SW")) return "Khung giờ vàng";
  if (code.startsWith("REWARD")) return "Phần thưởng";
  return "Mã giảm giá";
}

// Lấy danh sách voucher - Admin
router.get("/getmagg", async (req, res) => {
  try {
    const magg = await MaGiamGia.magiamgia
      .find({ isDeleted: { $ne: true } })
      .lean();
    const maggjson = magg.map((mg) => ({
      _id: mg._id,
      magiamgia: mg.magiamgia,
      soluong: mg.soluong,
      sophantram: mg.sophantram,
      ngaybatdau: moment(mg.ngaybatdau).format("DD/MM/YYYY"),
      ngayketthuc: moment(mg.ngayketthuc).format("DD/MM/YYYY"),
      minOrderValue: mg.minOrderValue || 0,
      maxOrderValue: mg.maxOrderValue || "Không giới hạn",
      goldenHourStart: mg.goldenHourStart || "Không giới hạn",
      goldenHourEnd: mg.goldenHourEnd || "Không giới hạn",
      isServerWide: mg.isServerWide || false,
      isOneTimePerUser: mg.isOneTimePerUser !== false,
      daysOfWeek:
        mg.daysOfWeek && mg.daysOfWeek.length > 0
          ? mg.daysOfWeek
              .map((day) => ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][day])
              .join(", ")
          : "Tất cả các ngày",
    }));
    res.json(maggjson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách mã giảm giá" });
  }
});

// Tạo voucher mới - Admin
router.post("/postmagg", async (req, res) => {
  try {
    const {
      soluong,
      sophantram,
      ngaybatdau,
      ngayketthuc,
      minOrderValue,
      maxOrderValue,
      goldenHourStart,
      goldenHourEnd,
      isServerWide,
      isOneTimePerUser,
      daysOfWeek,
    } = req.body;

    const magg = new MaGiamGia.magiamgia({
      soluong,
      sophantram,
      ngaybatdau,
      ngayketthuc,
      minOrderValue: minOrderValue || 0,
      maxOrderValue: maxOrderValue || null,
      goldenHourStart,
      goldenHourEnd,
      isServerWide: isServerWide || false,
      isOneTimePerUser: isOneTimePerUser !== false,
      daysOfWeek: daysOfWeek || [],
    });

    magg.magiamgia = "MGG" + magg._id.toString().slice(-4);
    await magg.save();
    res.json(magg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tạo mã giảm giá" });
  }
});

// Cập nhật voucher - Admin
router.post("/updatemagg/:idmagg", async (req, res) => {
  try {
    const {
      soluong,
      sophantram,
      ngaybatdau,
      ngayketthuc,
      minOrderValue,
      maxOrderValue,
      goldenHourStart,
      goldenHourEnd,
      isServerWide,
      isOneTimePerUser,
      daysOfWeek,
    } = req.body;

    const idmagg = req.params.idmagg;
    const magg = await MaGiamGia.magiamgia.findById(idmagg);

    if (!magg) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
    }

    magg.soluong = soluong;
    magg.sophantram = sophantram;
    magg.ngaybatdau = ngaybatdau;
    magg.ngayketthuc = ngayketthuc;
    magg.minOrderValue = minOrderValue || 0;
    magg.maxOrderValue = maxOrderValue || null;
    magg.goldenHourStart = goldenHourStart;
    magg.goldenHourEnd = goldenHourEnd;
    magg.isServerWide = isServerWide || false;
    magg.isOneTimePerUser = isOneTimePerUser !== false;
    magg.daysOfWeek = daysOfWeek || [];

    await magg.save();
    res.json(magg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật mã giảm giá" });
  }
});

// Xóa voucher (soft delete) - Admin
router.post("/deletemagg", async (req, res) => {
  try {
    const { ids, reason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Danh sách ID không hợp lệ" });
    }

    await Promise.all(
      ids.map((id) =>
        MaGiamGia.magiamgia.findByIdAndUpdate(id, {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.body.deletedBy || "System",
          deletionReason: reason || "Không có lý do",
        })
      )
    );

    res.json({ message: `Đã xóa thành công ${ids.length} mã giảm giá` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi trong quá trình xóa" });
  }
});

// Khôi phục voucher đã xóa - Admin
router.post("/restoremagg", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Danh sách ID không hợp lệ" });
    }

    await Promise.all(
      ids.map((id) =>
        MaGiamGia.magiamgia.findByIdAndUpdate(id, {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          deletionReason: null,
        })
      )
    );

    res.json({ message: `Đã khôi phục thành công ${ids.length} mã giảm giá` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi trong quá trình khôi phục" });
  }
});

// Lấy chi tiết voucher - Admin
router.get("/getchitietmagg/:idmagg", async (req, res) => {
  try {
    const idmagg = req.params.idmagg;
    const magg = await MaGiamGia.magiamgia.findById(idmagg);

    if (!magg) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
    }

    res.json(magg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết mã giảm giá" });
  }
});

// Kiểm tra và xác thực voucher khi thanh toán
router.post("/validatevoucher", async (req, res) => {
  try {
    const { magiamgia, phone, orderTotal, userId } = req.body;

    if (!magiamgia || (!phone && !userId) || orderTotal === undefined) {
      return res.status(400).json({
        valid: false,
        message: "Thiếu thông tin cần thiết",
      });
    }

    // Kiểm tra xem đây có phải là mã giảm giá từ chương trình điểm thưởng hay không
    let isPointsVoucher = false;
    if (phone) {
      try {
        const {
          RedemptionHistory,
        } = require("../models/RedemptionHistoryModel");
        const redemptionRecord = await RedemptionHistory.findOne({
          voucherCode: magiamgia,
          phone: phone,
          status: "active",
        });

        if (redemptionRecord) {
          isPointsVoucher = true;

          // Kiểm tra xem mã đã hết hạn chưa
          if (redemptionRecord.expiryDate < new Date()) {
            // Cập nhật trạng thái thành "hết hạn"
            redemptionRecord.status = "expired";
            await redemptionRecord.save();

            return res.json({
              valid: false,
              message: "Mã giảm giá đã hết hạn",
            });
          }
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra mã giảm giá từ điểm thưởng:", err);
      }
    }

    const voucher = await MaGiamGia.magiamgia.findOne({ magiamgia });

    if (!voucher) {
      return res.json({
        valid: false,
        message: "Mã giảm giá không tồn tại",
      });
    }

    // Kiểm tra nếu voucher thuộc về người dùng đặc biệt mà không phải người dùng hiện tại
    if (voucher.userId && userId && voucher.userId.toString() !== userId) {
      return res.json({
        valid: false,
        message: "Mã giảm giá này không thuộc về bạn",
      });
    }

    // Check if voucher has expired
    const ngayHienTai = moment();
    const ngayKetThuc = moment(voucher.ngayketthuc);
    const ngayBatDau = moment(voucher.ngaybatdau);

    if (ngayHienTai.isAfter(ngayKetThuc) || ngayHienTai.isBefore(ngayBatDau)) {
      return res.json({
        valid: false,
        message: "Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng",
      });
    }

    // Check if voucher has any remaining uses
    if (voucher.soluong <= 0) {
      return res.json({
        valid: false,
        message: "Mã giảm giá đã hết lượt sử dụng",
      });
    }

    // Check for minimum order value
    if (orderTotal < voucher.minOrderValue) {
      return res.json({
        valid: false,
        message: `Giá trị đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString(
          "vi-VN"
        )}đ`,
      });
    }

    // Check for maximum order value
    if (voucher.maxOrderValue && orderTotal > voucher.maxOrderValue) {
      return res.json({
        valid: false,
        message: `Giá trị đơn hàng không được vượt quá ${voucher.maxOrderValue.toLocaleString(
          "vi-VN"
        )}đ`,
      });
    }

    // Check golden hour restrictions
    if (voucher.goldenHourStart && voucher.goldenHourEnd) {
      if (!isWithinGoldenHour(voucher.goldenHourStart, voucher.goldenHourEnd)) {
        return res.json({
          valid: false,
          message: `Mã giảm giá chỉ có hiệu lực trong khung giờ vàng: ${voucher.goldenHourStart} - ${voucher.goldenHourEnd}`,
        });
      }
    }

    // Check day of week restrictions
    if (voucher.daysOfWeek && voucher.daysOfWeek.length > 0) {
      if (!isAllowedDayOfWeek(voucher.daysOfWeek)) {
        const allowedDays = voucher.daysOfWeek
          .map(
            (day) =>
              [
                "Chủ nhật",
                "Thứ 2",
                "Thứ 3",
                "Thứ 4",
                "Thứ 5",
                "Thứ 6",
                "Thứ 7",
              ][day]
          )
          .join(", ");

        return res.json({
          valid: false,
          message: `Mã giảm giá chỉ có hiệu lực vào: ${allowedDays}`,
        });
      }
    }

    // Check one-time-per-user restriction (if not server-wide)
    if (!voucher.isServerWide && voucher.isOneTimePerUser) {
      // Kiểm tra appliedUsers có chứa phone hoặc userId không
      const userApplied =
        (phone &&
          voucher.appliedUsers &&
          voucher.appliedUsers.includes(phone)) ||
        (userId &&
          voucher.appliedUsers &&
          voucher.appliedUsers.includes(userId));

      if (userApplied) {
        return res.json({
          valid: false,
          message: "Bạn đã sử dụng mã giảm giá này",
        });
      }
    }

    // Voucher is valid
    const discountAmount = ((orderTotal * voucher.sophantram) / 100).toFixed(0);

    // Nếu là voucher từ điểm thưởng, cập nhật trạng thái
    if (isPointsVoucher && phone) {
      try {
        const {
          RedemptionHistory,
        } = require("../models/RedemptionHistoryModel");
        const redemptionRecord = await RedemptionHistory.findOne({
          voucherCode: magiamgia,
          phone: phone,
          status: "active",
        });

        if (redemptionRecord) {
          redemptionRecord.status = "used";
          redemptionRecord.usedDate = new Date();
          await redemptionRecord.save();
        }
      } catch (error) {
        console.error(
          "Lỗi khi cập nhật trạng thái voucher điểm thưởng:",
          error
        );
      }
    }

    return res.json({
      valid: true,
      message: "Mã giảm giá hợp lệ",
      discountPercent: voucher.sophantram,
      discountAmount: parseInt(discountAmount),
      finalPrice: orderTotal - parseInt(discountAmount),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      valid: false,
      message: "Lỗi khi kiểm tra mã giảm giá",
    });
  }
});

// Tạo voucher toàn server (Giờ vàng) - Admin
router.post("/applyserverwidevoucher", async (req, res) => {
  try {
    const {
      sophantram,
      expireMinutes,
      minOrderValue,
      maxOrderValue,
      goldenHourStart,
      goldenHourEnd,
      isOneTimePerUser,
      daysOfWeek,
      message,
    } = req.body;

    const ngaybatdau = moment();
    const ngayketthuc = moment().add(expireMinutes || 60, "minutes"); // Default 60 minutes

    const magg = new MaGiamGia.magiamgia({
      soluong: 999999, // Số lượng lớn
      sophantram,
      ngaybatdau: ngaybatdau.toDate(),
      ngayketthuc: ngayketthuc.toDate(),
      minOrderValue: minOrderValue || 0,
      maxOrderValue: maxOrderValue || null,
      goldenHourStart,
      goldenHourEnd,
      isServerWide: true,
      isOneTimePerUser: isOneTimePerUser !== false,
      daysOfWeek: daysOfWeek || [],
      appliedUsers: [],
    });

    magg.magiamgia =
      "SW" + moment().format("DDHH") + magg._id.toString().slice(-4);
    await magg.save();

    res.json({
      success: true,
      voucher: {
        code: magg.magiamgia,
        percentOff: sophantram,
        expiresAt: ngayketthuc.format("DD/MM/YYYY HH:mm"),
        message:
          message ||
          `Mã giảm giá toàn server ${sophantram}%, hết hạn sau ${
            expireMinutes || 60
          } phút!`,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo mã giảm giá toàn server",
    });
  }
});

// Lấy danh sách voucher đã xóa - Admin
router.get("/getdeletedmagg", async (req, res) => {
  try {
    const deletedVouchers = await MaGiamGia.magiamgia
      .find({ isDeleted: true })
      .lean();
    const vouchersJson = deletedVouchers.map((mg) => ({
      _id: mg._id,
      magiamgia: mg.magiamgia,
      soluong: mg.soluong,
      sophantram: mg.sophantram,
      ngaybatdau: moment(mg.ngaybatdau).format("DD/MM/YYYY"),
      ngayketthuc: moment(mg.ngayketthuc).format("DD/MM/YYYY"),
      deletedAt: moment(mg.deletedAt).format("DD/MM/YYYY HH:mm:ss"),
      deletedBy: mg.deletedBy,
      deletionReason: mg.deletionReason,
    }));
    res.json(vouchersJson);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách mã giảm giá đã xóa" });
  }
});

// API chung cho kiểm tra và tìm kiếm voucher
router.get("/timkiemvoucher/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin định danh",
      });
    }

    // Xác định loại định danh (userId hoặc số điện thoại)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const isPhoneNumber = /^\d{10,12}$/.test(identifier);

    if (!isObjectId && !isPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Định danh không hợp lệ",
      });
    }

    // Biến lưu thông tin người dùng
    let user = null;

    // Lấy thông tin người dùng
    const User = require("../models/user.model");

    if (isObjectId) {
      // Nếu là userId
      try {
        user = await User.User.findById(identifier);
      } catch (error) {
        console.error("Lỗi tìm user:", error);
      }
    } else {
      // Nếu là số điện thoại
      try {
        user = await User.User.findOne({ phone: identifier });
      } catch (error) {
        console.error("Lỗi tìm user từ SĐT:", error);
      }
    }

    // Nếu không tìm thấy user, trả về mảng rỗng
    if (!user) {
      return res.json({
        success: true,
        vouchers: [],
      });
    }

    // Tạo điều kiện tìm kiếm với user._id
    const queryConditions = [
      { userId: user._id },
      { intended_users: user._id },
      { isServerWide: true },
    ];

    // Tìm tất cả voucher hợp lệ
    const allVouchers = await MaGiamGia.magiamgia
      .find({
        isDeleted: { $ne: true },
        ngaybatdau: { $lte: new Date() },
        ngayketthuc: { $gte: new Date() },
        soluong: { $gt: 0 },
        $or: queryConditions,
      })
      .lean();

    // Lọc voucher người dùng đã sử dụng
    const userVouchers = allVouchers.filter((voucher) => {
      // Nếu voucher dùng một lần và người dùng đã sử dụng
      if (
        voucher.isOneTimePerUser &&
        voucher.appliedUsers &&
        voucher.appliedUsers.length > 0
      ) {
        // Kiểm tra xem user._id có trong danh sách appliedUsers không
        const hasUsed = voucher.appliedUsers.some(
          (id) => id && id.toString() === user._id.toString()
        );

        if (hasUsed) return false;
      }
      return true;
    });

    // Lọc voucher trùng lặp, chỉ giữ lại voucher tốt nhất của mỗi loại
    const voucherTypes = {};
    userVouchers.forEach((voucher) => {
      const prefix = getVoucherPrefix(voucher.magiamgia);

      // Voucher khung giờ vàng (SW) giữ tất cả
      if (prefix === "SW") {
        if (!voucherTypes[prefix]) {
          voucherTypes[prefix] = [];
        }
        voucherTypes[prefix].push(voucher);
        return;
      }

      // Các loại voucher khác, chỉ giữ lại voucher có % giảm cao nhất
      if (
        !voucherTypes[prefix] ||
        voucher.sophantram > voucherTypes[prefix].sophantram
      ) {
        voucherTypes[prefix] = voucher;
      }
    });

    // Chuyển về dạng mảng
    let filteredVouchers = [];
    Object.keys(voucherTypes).forEach((type) => {
      if (Array.isArray(voucherTypes[type])) {
        filteredVouchers = [...filteredVouchers, ...voucherTypes[type]];
      } else {
        filteredVouchers.push(voucherTypes[type]);
      }
    });

    // Định dạng voucher để trả về client
    const now = moment();
    const transformedVouchers = filteredVouchers.map((voucher) => {
      // Tính thời gian còn lại
      const timeLeft = moment(voucher.ngayketthuc).diff(now, "hours");

      // Kiểm tra giờ vàng
      const isGoldenHour = voucher.goldenHourStart && voucher.goldenHourEnd;
      let isCurrentlyGoldenHour = false;

      if (isGoldenHour) {
        const currentTime = now.format("HH:mm");
        const currentDay = now.day();

        // Kiểm tra thời gian
        if (voucher.goldenHourStart <= voucher.goldenHourEnd) {
          isCurrentlyGoldenHour =
            currentTime >= voucher.goldenHourStart &&
            currentTime <= voucher.goldenHourEnd;
        } else {
          isCurrentlyGoldenHour =
            currentTime >= voucher.goldenHourStart ||
            currentTime <= voucher.goldenHourEnd;
        }

        // Kiểm tra ngày trong tuần
        if (voucher.daysOfWeek && voucher.daysOfWeek.length > 0) {
          isCurrentlyGoldenHour =
            isCurrentlyGoldenHour && voucher.daysOfWeek.includes(currentDay);
        }
      }

      // Kiểm tra người dùng đã sử dụng voucher chưa
      const hasUsed =
        voucher.appliedUsers &&
        voucher.appliedUsers.some(
          (id) => id && id.toString() === user._id.toString()
        );

      return {
        _id: voucher._id,
        magiamgia: voucher.magiamgia,
        sophantram: voucher.sophantram,
        soluong: voucher.soluong,
        minOrderValue: voucher.minOrderValue || 0,
        maxOrderValue: voucher.maxOrderValue || null,
        ngaybatdau: moment(voucher.ngaybatdau).format("DD/MM/YYYY"),
        ngayketthuc: moment(voucher.ngayketthuc).format("DD/MM/YYYY"),
        goldenHourStart: voucher.goldenHourStart,
        goldenHourEnd: voucher.goldenHourEnd,
        isServerWide: voucher.isServerWide,
        daysOfWeek: voucher.daysOfWeek || [],
        timeLeft: timeLeft,
        isGoldenHour: isGoldenHour,
        isCurrentlyGoldenHour: isCurrentlyGoldenHour,
        isOneTimePerUser: voucher.isOneTimePerUser,
        hasUsed: hasUsed,
        voucherType: getVoucherTypeLabel(voucher.magiamgia),
      };
    });

    res.json({
      success: true,
      vouchers: transformedVouchers,
    });
  } catch (error) {
    console.error("Lỗi tìm kiếm voucher:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tìm kiếm mã giảm giá",
    });
  }
});

router.get("/checknewvouchers/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    // Check if valid identifier
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Missing identifier",
      });
    }

    // Determine identifier type (userId or phone)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const isPhoneNumber = /^\d{10,12}$/.test(identifier);

    if (!isObjectId && !isPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid identifier format",
      });
    }

    // Get user data
    let user = null;

    // If identifier is userId
    if (isObjectId) {
      user = await User.User.findById(identifier);
    }
    // If identifier is phone number
    else if (isPhoneNumber) {
      user = await User.User.findOne({ phone: identifier });
    }

    if (!user) {
      return res.json({
        success: true,
        hasNewVouchers: false,
        vouchers: [],
      });
    }

    // Get current time and one hour ago
    const now = moment();
    const oneHourAgo = moment().subtract(1, "hour").toDate();

    // Find new vouchers (created in the last hour)
    const newVouchers = await MaGiamGia.magiamgia
      .find({
        $or: [
          { intended_users: user._id },
          { userId: user._id },
          { isServerWide: true },
        ],
        ngaybatdau: { $gte: oneHourAgo },
        ngayketthuc: { $gte: now.toDate() },
        soluong: { $gt: 0 },
        isDeleted: { $ne: true },
      })
      .sort({ ngaybatdau: -1 })
      .limit(5)
      .lean();

    // Find golden hour vouchers active now
    const goldenHourVouchers = await MaGiamGia.magiamgia
      .find({
        $or: [
          { intended_users: user._id },
          { userId: user._id },
          { isServerWide: true },
        ],
        goldenHourStart: { $ne: null },
        goldenHourEnd: { $ne: null },
        ngayketthuc: { $gte: now.toDate() },
        soluong: { $gt: 0 },
        isDeleted: { $ne: true },
      })
      .lean();

    // Filter golden hour vouchers by current time
    const currentTime = now.format("HH:mm");
    const currentDay = now.day();

    const activeGoldenHourVouchers = goldenHourVouchers.filter((voucher) => {
      // Check time
      let isTimeValid = false;
      if (voucher.goldenHourStart <= voucher.goldenHourEnd) {
        isTimeValid =
          currentTime >= voucher.goldenHourStart &&
          currentTime <= voucher.goldenHourEnd;
      } else {
        isTimeValid =
          currentTime >= voucher.goldenHourStart ||
          currentTime <= voucher.goldenHourEnd;
      }

      if (!isTimeValid) return false;

      // Check day of week if specified
      if (voucher.daysOfWeek && voucher.daysOfWeek.length > 0) {
        return voucher.daysOfWeek.includes(currentDay);
      }

      return true;
    });

    // Filter out vouchers the user has already used
    const userId = user._id.toString();

    const filteredNewVouchers = newVouchers.filter((voucher) => {
      if (voucher.isOneTimePerUser && voucher.appliedUsers) {
        return !voucher.appliedUsers.some(
          (id) => id && id.toString() === userId
        );
      }
      return true;
    });

    const filteredGoldenHourVouchers = activeGoldenHourVouchers.filter(
      (voucher) => {
        if (voucher.isOneTimePerUser && voucher.appliedUsers) {
          return !voucher.appliedUsers.some(
            (id) => id && id.toString() === userId
          );
        }
        return true;
      }
    );

    // Format vouchers for response
    const formattedVouchers = [
      ...filteredNewVouchers,
      ...filteredGoldenHourVouchers,
    ].map((voucher) => ({
      code: voucher.magiamgia,
      discount: voucher.sophantram,
      minOrderValue: voucher.minOrderValue || 0,
      expiresAt: moment(voucher.ngayketthuc).format("DD/MM/YYYY"),
      isNew: moment(voucher.ngaybatdau).isAfter(oneHourAgo),
      isGoldenHour: Boolean(voucher.goldenHourStart && voucher.goldenHourEnd),
      currentlyActive: filteredGoldenHourVouchers.some(
        (v) => v._id.toString() === voucher._id.toString()
      ),
    }));

    res.json({
      success: true,
      hasNewVouchers: formattedVouchers.length > 0,
      vouchers: formattedVouchers,
    });
  } catch (error) {
    console.error("Error checking new vouchers:", error);
    res.status(500).json({
      success: false,
      message: "Error checking for new vouchers",
    });
  }
});

module.exports = router;

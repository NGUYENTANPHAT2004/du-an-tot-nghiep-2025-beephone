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

router.get("/getmagg", async (req, res) => {
  try {
    const magg = await MaGiamGia.magiamgia
      .find({ isDeleted: { $ne: true } })
      .lean();
    const maggjson = magg.map((mg) => {
      return {
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
        isOneTimePerUser: mg.isOneTimePerUser !== false, // Default to true if not specified
        daysOfWeek:
          mg.daysOfWeek && mg.daysOfWeek.length > 0
            ? mg.daysOfWeek
                .map((day) => ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][day])
                .join(", ")
            : "Tất cả các ngày",
      };
    });
    res.json(maggjson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách mã giảm giá" });
  }
});

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

router.post("/deletemagg", async (req, res) => {
  try {
    const { ids, reason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Danh sách ID không hợp lệ" });
    }

    // Soft delete the vouchers
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

// New endpoint to validate voucher with all the new constraints
router.post("/validatevoucher", async (req, res) => {
  try {
    const { magiamgia, phone, orderTotal } = req.body;

    if (!magiamgia || !phone || orderTotal === undefined) {
      return res.status(400).json({
        valid: false,
        message: "Thiếu thông tin cần thiết",
      });
    }

    const voucher = await MaGiamGia.magiamgia.findOne({ magiamgia });

    if (!voucher) {
      return res.json({
        valid: false,
        message: "Mã giảm giá không tồn tại",
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
      if (voucher.appliedUsers && voucher.appliedUsers.includes(phone)) {
        return res.json({
          valid: false,
          message: "Bạn đã sử dụng mã giảm giá này",
        });
      }
    }

    // Voucher is valid
    const discountAmount = ((orderTotal * voucher.sophantram) / 100).toFixed(0);
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

// Endpoint to apply a voucher server-wide to all users
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

    // Create start and end dates for the voucher
    const ngaybatdau = moment();
    const ngayketthuc = moment().add(expireMinutes || 60, "minutes"); // Default 60 minutes if not specified

    // Generate a server-wide voucher
    const magg = new MaGiamGia.magiamgia({
      soluong: 999999, // High quantity for server-wide use
      sophantram,
      ngaybatdau: ngaybatdau.toDate(),
      ngayketthuc: ngayketthuc.toDate(),
      minOrderValue: minOrderValue || 0,
      maxOrderValue: maxOrderValue || null,
      goldenHourStart,
      goldenHourEnd,
      isServerWide: true, // Mark as server-wide
      isOneTimePerUser: isOneTimePerUser !== false,
      daysOfWeek: daysOfWeek || [],
      appliedUsers: [],
    });

    // Generate a memorable code for server-wide vouchers with "SW" prefix (Server Wide)
    magg.magiamgia =
      "SW" + moment().format("DDHH") + magg._id.toString().slice(-4);

    await magg.save();

    // Return the newly created voucher information
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
router.get("/activegoldenhour/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const currentTime = moment().format("HH:mm");
    const currentDay = moment().day(); // 0-6, Sunday-Saturday

    // Find all active vouchers with golden hour restrictions
    const activeVouchers = await MaGiamGia.magiamgia
      .find({
        ngaybatdau: { $lte: new Date() },
        ngayketthuc: { $gte: new Date() },
        soluong: { $gt: 0 },
        goldenHourStart: { $ne: null },
        goldenHourEnd: { $ne: null },
      })
      .lean();

    // Filter vouchers by current time and day
    const availableVouchers = activeVouchers.filter((voucher) => {
      // Check golden hour
      const isTimeValid = isWithinGoldenHour(
        voucher.goldenHourStart,
        voucher.goldenHourEnd
      );

      // Check day of week
      const isDayValid =
        voucher.daysOfWeek && voucher.daysOfWeek.length > 0
          ? voucher.daysOfWeek.includes(currentDay)
          : true;

      // Check if user already used it (for one-time vouchers)
      const isAvailableForUser =
        voucher.isServerWide ||
        !voucher.isOneTimePerUser ||
        !(voucher.appliedUsers && voucher.appliedUsers.includes(phone));

      return isTimeValid && isDayValid && isAvailableForUser;
    });

    if (availableVouchers.length > 0) {
      res.json({
        hasActiveVouchers: true,
        vouchers: availableVouchers.map((v) => ({
          code: v.magiamgia,
          percentOff: v.sophantram,
          minOrderValue: v.minOrderValue,
          maxOrderValue: v.maxOrderValue,
          goldenHourTime: `${v.goldenHourStart} - ${v.goldenHourEnd}`,
        })),
      });
    } else {
      res.json({
        hasActiveVouchers: false,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      hasActiveVouchers: false,
      message: "Lỗi khi kiểm tra khung giờ vàng",
    });
  }
});
// Cập nhật endpoint /timkiemvoucher/:phone trong file MaGiamGiaRoutes.js
// Cập nhật endpoint /timkiemvoucher/:phone trong file MaGiamGiaRoutes.js
router.get("/timkiemvoucher/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      console.log("Missing phone parameter in /timkiemvoucher");
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không được cung cấp",
      });
    }

    // Validate phone format
    if (!/^\d{10,12}$/.test(phone.toString().trim())) {
      console.log(`Invalid phone format in /timkiemvoucher: ${phone}`);
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    // Get current date and time
    const now = moment();

    // Find all active and non-deleted vouchers available for this user
    const allVouchers = await MaGiamGia.magiamgia
      .find({
        isDeleted: { $ne: true },
        ngaybatdau: { $lte: now.toDate() },
        ngayketthuc: { $gte: now.toDate() },
        soluong: { $gt: 0 },
        $or: [
          // Server-wide vouchers
          { isServerWide: true },

          // Vouchers specifically created for this user
          { intended_users: phone },
        ],
      })
      .lean();

    console.log(
      `Found ${allVouchers.length} total vouchers for phone ${phone}`
    );

    // Filter vouchers for this user - exclude those already used by this user
    const userVouchers = allVouchers.filter((voucher) => {
      if (
        voucher.isOneTimePerUser &&
        voucher.appliedUsers &&
        voucher.appliedUsers.includes(phone)
      ) {
        return false; // Skip if user has already used this one-time voucher
      }

      return true;
    });

    console.log(
      `After filtering already used vouchers: ${userVouchers.length} available for ${phone}`
    );

    // Filter out duplicate voucher types - keep only the best of each type
    const voucherTypes = {};
    userVouchers.forEach((voucher) => {
      const prefix = getVoucherPrefix(voucher.magiamgia);

      // Special case for server-wide/golden hour vouchers - keep all of them
      if (prefix === "SW") {
        if (!voucherTypes[prefix]) {
          voucherTypes[prefix] = [];
        }
        voucherTypes[prefix].push(voucher);
        return;
      }

      // For other voucher types, only keep the one with highest discount
      if (
        !voucherTypes[prefix] ||
        voucher.sophantram > voucherTypes[prefix].sophantram
      ) {
        voucherTypes[prefix] = voucher;
      }
    });

    // Convert back to array
    let filteredVouchers = [];
    Object.keys(voucherTypes).forEach((type) => {
      if (Array.isArray(voucherTypes[type])) {
        filteredVouchers = [...filteredVouchers, ...voucherTypes[type]];
      } else {
        filteredVouchers.push(voucherTypes[type]);
      }
    });

    console.log(
      `After removing duplicates: ${filteredVouchers.length} vouchers for ${phone}`
    );

    // Transform vouchers for client response
    const transformedVouchers = filteredVouchers.map((voucher) => {
      const timeLeft = moment(voucher.ngayketthuc).diff(now, "hours");
      const isGoldenHour = voucher.goldenHourStart && voucher.goldenHourEnd;

      // Check if this voucher is currently in golden hour
      let isCurrentlyGoldenHour = false;
      if (isGoldenHour) {
        const currentTime = now.format("HH:mm");
        const currentDay = now.day(); // 0-6, Sunday-Saturday

        // Check time
        if (voucher.goldenHourStart <= voucher.goldenHourEnd) {
          isCurrentlyGoldenHour =
            currentTime >= voucher.goldenHourStart &&
            currentTime <= voucher.goldenHourEnd;
        } else {
          isCurrentlyGoldenHour =
            currentTime >= voucher.goldenHourStart ||
            currentTime <= voucher.goldenHourEnd;
        }

        // Check day of week
        if (voucher.daysOfWeek && voucher.daysOfWeek.length > 0) {
          isCurrentlyGoldenHour =
            isCurrentlyGoldenHour && voucher.daysOfWeek.includes(currentDay);
        }
      }

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
        hasUsed: voucher.appliedUsers && voucher.appliedUsers.includes(phone),
        voucherType: getVoucherTypeLabel(voucher.magiamgia),
      };
    });

    res.json({
      success: true,
      vouchers: transformedVouchers,
    });
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tìm kiếm mã giảm giá",
    });
  }
});

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

// Helper function to get voucher prefix
function getVoucherPrefix(code) {
  if (code.startsWith("FIRST")) return "FIRST";
  if (code.startsWith("LOYAL")) return "LOYAL";
  if (code.startsWith("WELCOME")) return "WELCOME";
  if (code.startsWith("SW")) return "SW";
  if (code.startsWith("REWARD")) return "REWARD";
  return "OTHER";
}

// Cập nhật endpoint /activegoldenhour/:phone trong file MaGiamGiaRoutes.js
router.get("/activegoldenhour/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const currentTime = moment().format("HH:mm");
    const currentDay = moment().day(); // 0-6, Sunday-Saturday

    // Find all active vouchers with golden hour restrictions
    const activeVouchers = await MaGiamGia.magiamgia
      .find({
        ngaybatdau: { $lte: new Date() },
        ngayketthuc: { $gte: new Date() },
        soluong: { $gt: 0 },
        goldenHourStart: { $ne: null },
        goldenHourEnd: { $ne: null },
        isDeleted: { $ne: true },
      })
      .lean();

    // Filter vouchers by current time and day
    const availableVouchers = activeVouchers.filter((voucher) => {
      // Check golden hour
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

      // Check day of week
      const isDayValid =
        voucher.daysOfWeek && voucher.daysOfWeek.length > 0
          ? voucher.daysOfWeek.includes(currentDay)
          : true;

      if (!isDayValid) return false;

      // Check if user already used it (for one-time vouchers)
      const isAvailableForUser =
        voucher.isServerWide ||
        !voucher.isOneTimePerUser ||
        !(voucher.appliedUsers && voucher.appliedUsers.includes(phone));

      return isAvailableForUser;
    });

    // Tìm tối đa 3 voucher khung giờ vàng để thông báo
    const limitedVouchers = availableVouchers.slice(0, 3);

    if (limitedVouchers.length > 0) {
      res.json({
        hasActiveVouchers: true,
        vouchers: limitedVouchers.map((v) => ({
          code: v.magiamgia,
          percentOff: v.sophantram,
          minOrderValue: v.minOrderValue,
          maxOrderValue: v.maxOrderValue,
          goldenHourTime: `${v.goldenHourStart} - ${v.goldenHourEnd}`,
        })),
      });
    } else {
      res.json({
        hasActiveVouchers: false,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      hasActiveVouchers: false,
      message: "Lỗi khi kiểm tra khung giờ vàng",
    });
  }
});
// Cập nhật endpoint /checknewvouchers/:phone trong file MaGiamGiaRoutes.js
router.get("/checknewvouchers/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      console.log("Missing phone parameter in /checknewvouchers");
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không được cung cấp",
      });
    }

    // Validate phone format
    if (!/^\d{10,12}$/.test(phone.toString().trim())) {
      console.log(`Invalid phone format in /checknewvouchers: ${phone}`);
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    // Get current date and time
    const now = moment();
    const oneHourAgo = moment().subtract(1, "hour").toDate();

    // Tìm voucher mới cho user này (tạo trong 1 giờ gần đây)
    const newVouchers = await MaGiamGia.magiamgia
      .find({
        ngaybatdau: { $gte: oneHourAgo },
        ngayketthuc: { $gte: now.toDate() },
        soluong: { $gt: 0 },
        isDeleted: { $ne: true },
        $or: [
          // Server-wide vouchers
          { isServerWide: true },

          // Vouchers specifically created for this user
          { intended_users: phone },
        ],
      })
      .sort({ ngaybatdau: -1 })
      .limit(5)
      .lean();

    console.log(`Found ${newVouchers.length} new vouchers for phone ${phone}`);

    // Cũng kiểm tra xem có voucher khung giờ vàng nào đang hoạt động không
    const goldenHourVouchers = await MaGiamGia.magiamgia
      .find({
        ngaybatdau: { $lte: now.toDate() },
        ngayketthuc: { $gte: now.toDate() },
        soluong: { $gt: 0 },
        goldenHourStart: { $ne: null },
        goldenHourEnd: { $ne: null },
        isDeleted: { $ne: true },
        appliedUsers: { $nin: [phone] }, // Chưa được sử dụng bởi user này
      })
      .limit(2)
      .lean();

    // Lọc voucher khung giờ vàng theo thời gian hiện tại
    const currentTime = now.format("HH:mm");
    const currentDay = now.day(); // 0-6, Sunday-Saturday

    const activeGoldenHourVouchers = goldenHourVouchers.filter((voucher) => {
      // Check golden hour time
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

      // Check day of week
      const isDayValid =
        voucher.daysOfWeek && voucher.daysOfWeek.length > 0
          ? voucher.daysOfWeek.includes(currentDay)
          : true;

      return isDayValid;
    });

    console.log(
      `Found ${activeGoldenHourVouchers.length} active golden hour vouchers for phone ${phone}`
    );

    // Combine both normal and golden hour vouchers
    const allAvailableVouchers = [...newVouchers, ...activeGoldenHourVouchers];

    // Format vouchers for response
    const formattedVouchers = allAvailableVouchers.map((voucher) => {
      // Check if this voucher is in golden hour
      let isInGoldenHour = false;
      if (voucher.goldenHourStart && voucher.goldenHourEnd) {
        if (voucher.goldenHourStart <= voucher.goldenHourEnd) {
          isInGoldenHour =
            currentTime >= voucher.goldenHourStart &&
            currentTime <= voucher.goldenHourEnd;
        } else {
          isInGoldenHour =
            currentTime >= voucher.goldenHourStart ||
            currentTime <= voucher.goldenHourEnd;
        }
      }

      return {
        code: voucher.magiamgia,
        discount: voucher.sophantram,
        minOrderValue: voucher.minOrderValue || 0,
        expiresAt: moment(voucher.ngayketthuc).format("DD/MM/YYYY"),
        isNew: moment(voucher.ngaybatdau).isAfter(oneHourAgo),
        isGoldenHour: Boolean(voucher.goldenHourStart && voucher.goldenHourEnd),
        currentlyActive: isInGoldenHour,
      };
    });

    res.json({
      success: true,
      hasNewVouchers: formattedVouchers.length > 0,
      vouchers: formattedVouchers,
    });
  } catch (error) {
    console.error("Error checking new vouchers:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi kiểm tra voucher mới",
    });
  }
});
router.post("/restoremagg", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Danh sách ID không hợp lệ" });
    }

    // Restore the vouchers
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

// Add route to get deleted vouchers
router.get("/getdeletedmagg", async (req, res) => {
  try {
    const deletedVouchers = await MaGiamGia.magiamgia
      .find({ isDeleted: true })
      .lean();
    const vouchersJson = deletedVouchers.map((mg) => {
      return {
        _id: mg._id,
        magiamgia: mg.magiamgia,
        soluong: mg.soluong,
        sophantram: mg.sophantram,
        ngaybatdau: moment(mg.ngaybatdau).format("DD/MM/YYYY"),
        ngayketthuc: moment(mg.ngayketthuc).format("DD/MM/YYYY"),
        deletedAt: moment(mg.deletedAt).format("DD/MM/YYYY HH:mm:ss"),
        deletedBy: mg.deletedBy,
        deletionReason: mg.deletionReason,
      };
    });
    res.json(vouchersJson);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách mã giảm giá đã xóa" });
  }
});

module.exports = router;

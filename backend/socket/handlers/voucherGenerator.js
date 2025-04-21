// utils/voucherGenerator.js - Fixed version

const moment = require("moment");
const MaGiamGia = require("../../models/MaGiamGiaModel");
const HoaDon = require("../../models/HoaDonModel");
const User = require("../../models/user.model");
const db = require("../../models/db.js");
/**
 * Tạo voucher ngẫu nhiên cho người dùng đã đăng nhập
 * @param {string} userId - ID người dùng đã đăng nhập
 * @param {string} reason - Lý do tạo voucher (first-order, third-order, new-account)
 * @param {number} expiryDays - Số ngày đến khi voucher hết hạn
 * @returns {Promise<object>} - Đối tượng voucher đã tạo
 */
async function generateVoucherForUser(
  userId,
  reason = "reward",
  expiryDays = 30
) {
  const session = await db.mongoose.startSession();
  session.startTransaction();

  try {
    // Validate userId
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      console.error("Cannot generate voucher: Invalid userId", userId);
      throw new Error("Invalid userId");
    }

    console.log(`Generating ${reason} voucher for user ${userId}`);

    // Get user details
    const user = await User.User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("User not found");
    }

    // Check existing vouchers
    const activeVouchers = await MaGiamGia.magiamgia
      .find({
        ngayketthuc: { $gte: new Date() },
        soluong: { $gt: 0 },
        $or: [{ userId: userId }, { intended_users: userId }],
        isDeleted: { $ne: true },
      })
      .session(session);

    // Limit personal vouchers
    const userSpecificVouchers = activeVouchers.filter((v) => !v.isServerWide);
    const VOUCHER_LIMIT = 5; // Max 5 personal vouchers

    if (
      userSpecificVouchers.length >= VOUCHER_LIMIT &&
      reason !== "new-account"
    ) {
      await session.abortTransaction();
      session.endSession();

      return {
        code: userSpecificVouchers[0].magiamgia,
        discount: userSpecificVouchers[0].sophantram,
        minOrderValue: userSpecificVouchers[0].minOrderValue,
        expiresAt: moment(userSpecificVouchers[0].ngayketthuc).format(
          "DD/MM/YYYY"
        ),
        message: "Bạn đã có sẵn mã giảm giá!",
        isNew: false,
      };
    }

    // Check if user already has a voucher of this type USING USER ID
    const existingVoucher = await MaGiamGia.magiamgia
      .findOne({
        magiamgia: { $regex: new RegExp(`^${getVoucherPrefix(reason)}`) },
        ngayketthuc: { $gte: new Date() },
        soluong: { $gt: 0 },
        $or: [{ userId: userId }, { intended_users: userId }],
        isDeleted: { $ne: true },
      })
      .session(session);

    if (existingVoucher && reason !== "reward") {
      await session.abortTransaction();
      session.endSession();

      return {
        code: existingVoucher.magiamgia,
        discount: existingVoucher.sophantram,
        minOrderValue: existingVoucher.minOrderValue,
        expiresAt: moment(existingVoucher.ngayketthuc).format("DD/MM/YYYY"),
        message: getVoucherMessage(reason),
        description: getVoucherDescription(reason),
        isNew: false,
      };
    }

    // Configure voucher based on type
    const voucherConfig = getVoucherConfig(reason);

    // Set dates
    const ngaybatdau = moment();
    const ngayketthuc = moment().add(expiryDays, "days");

    // Generate unique code
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const voucherCode = `${voucherConfig.prefix}-${randomCode}`;

    // Create voucher
    const magg = new MaGiamGia.magiamgia({
      magiamgia: voucherCode,
      soluong: 1, // One-time use
      sophantram: voucherConfig.discount,
      ngaybatdau: ngaybatdau.toDate(),
      ngayketthuc: ngayketthuc.toDate(),
      minOrderValue: voucherConfig.minOrderValue,
      maxOrderValue: null,
      isServerWide: false,
      isOneTimePerUser: true,
      intended_users: [userId], // Use user ID directly
      appliedUsers: [],
      description: voucherConfig.description,
      userId: userId,
    });

    await magg.save({ session });

    await session.commitTransaction();
    session.endSession();

    console.log(`Created ${reason} voucher ${voucherCode} for user ${userId}`);

    return {
      code: magg.magiamgia,
      discount: magg.sophantram,
      minOrderValue: magg.minOrderValue,
      expiresAt: ngayketthuc.format("DD/MM/YYYY"),
      message: voucherConfig.message,
      description: voucherConfig.description,
      isNew: true,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error generating voucher:", error);
    throw error;
  }
}

/**
 * Gets voucher configuration based on reason
 */
function getVoucherConfig(reason) {
  const configs = {
    "first-order": {
      prefix: "FIRST",
      discount: getRandomDiscount(15, 20), // 15-20% discount
      minOrderValue: 100000,
      message: "Cảm ơn bạn đã mua hàng lần đầu!",
      description: "Ưu đãi đặc biệt cho đơn hàng đầu tiên của bạn",
    },
    "third-order": {
      prefix: "LOYAL",
      discount: getRandomDiscount(20, 25), // 20-25% discount
      minOrderValue: 200000,
      message: "Cảm ơn bạn đã là khách hàng thân thiết!",
      description: "Ưu đãi dành cho khách hàng trung thành",
    },
    "new-account": {
      prefix: "WELCOME",
      discount: getRandomDiscount(10, 15), // 10-15% discount
      minOrderValue: 50000,
      message: "Chào mừng bạn đến với cửa hàng của chúng tôi!",
      description: "Ưu đãi chào mừng thành viên mới",
    },
    reward: {
      prefix: "REWARD",
      discount: getRandomDiscount(10, 20), // 10-20% discount
      minOrderValue: 100000,
      message: "Mã giảm giá dành riêng cho bạn!",
      description: "Ưu đãi đặc biệt từ cửa hàng",
    },
  };

  return configs[reason] || configs.reward;
}

/**
 * Gets voucher prefix based on reason
 */
function getVoucherPrefix(reason) {
  const prefixMap = {
    "first-order": "FIRST",
    "third-order": "LOYAL",
    "new-account": "WELCOME",
    reward: "REWARD",
  };

  return prefixMap[reason] || "REWARD";
}

/**
 * Gets voucher message based on reason
 */
function getVoucherMessage(reason) {
  const messageMap = {
    "first-order": "Cảm ơn bạn đã mua hàng lần đầu!",
    "third-order": "Cảm ơn bạn đã là khách hàng thân thiết!",
    "new-account": "Chào mừng bạn đến với cửa hàng của chúng tôi!",
    reward: "Mã giảm giá dành riêng cho bạn!",
  };

  return messageMap[reason] || "Mã giảm giá dành riêng cho bạn!";
}

/**
 * Gets voucher description based on reason
 */
function getVoucherDescription(reason) {
  const descriptionMap = {
    "first-order": "Ưu đãi đặc biệt cho đơn hàng đầu tiên của bạn",
    "third-order": "Ưu đãi dành cho khách hàng trung thành",
    "new-account": "Ưu đãi chào mừng thành viên mới",
    reward: "Ưu đãi đặc biệt từ cửa hàng",
  };

  return descriptionMap[reason] || "Ưu đãi đặc biệt từ cửa hàng";
}

/**
 * Kiểm tra xem người dùng có đủ điều kiện nhận voucher đơn hàng đầu tiên không
 * @param {string} userId - User ID của người dùng đã đăng nhập
 * @returns {Promise<boolean>} - True nếu đủ điều kiện
 */
async function isFirstOrderVoucherEligible(userId) {
  try {
    // Yêu cầu userId hợp lệ
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      console.log(
        "Không thể kiểm tra tư cách nhận voucher đơn đầu: Không có userId hợp lệ"
      );
      return false;
    }

    // Tìm user
    const user = await User.User.findById(userId);
    if (!user) {
      console.log(`Không tìm thấy thông tin người dùng với userId ${userId}`);
      return false;
    }

    // Đếm đơn hàng thành công
    const orderCount = await HoaDon.hoadon.countDocuments({
      userId: userId,
      thanhtoan: true,
      trangthai: { $in: ["Đã thanh toán", "Hoàn thành", "Đã nhận"] },
    });

    console.log(`Người dùng ${userId} có ${orderCount} đơn hàng hoàn thành`);

    // Điều kiện: đơn hàng đầu tiên
    const eligible = orderCount === 1;

    // Nếu đủ điều kiện, kiểm tra đã có voucher chưa
    if (eligible) {
      // CHỈ TÌM BẰNG userId
      const existingVoucher = await MaGiamGia.magiamgia.findOne({
        magiamgia: { $regex: /^FIRST/ },
        ngayketthuc: { $gte: new Date() },
        $or: [{ userId: userId }, { intended_users: userId }],
      });

      if (existingVoucher) {
        console.log(`Người dùng ${userId} đã có voucher FIRST còn hiệu lực`);
        return false;
      }
    }

    return eligible;
  } catch (error) {
    console.error("Lỗi khi kiểm tra tư cách nhận voucher đơn đầu:", error);
    return false;
  }
}

/**
 * Kiểm tra xem người dùng có đủ điều kiện nhận voucher đơn hàng thứ 3, 6, 9... không
 * @param {string} userId - User ID của người dùng đã đăng nhập
 * @returns {Promise<boolean>} - True nếu đủ điều kiện
 */
async function isThirdOrderVoucherEligible(userId) {
  try {
    // Yêu cầu userId hợp lệ
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      console.log(
        "Không thể kiểm tra tư cách nhận voucher đơn thứ 3: Không có userId hợp lệ"
      );
      return false;
    }

    // Tìm user
    const user = await User.User.findById(userId);
    if (!user) {
      console.log(`Không tìm thấy thông tin người dùng với userId ${userId}`);
      return false;
    }

    // Đếm số đơn hàng thành công
    const orderCount = await HoaDon.hoadon.countDocuments({
      userId: userId,
      thanhtoan: true,
      trangthai: { $in: ["Đã thanh toán", "Hoàn thành", "Đã nhận"] },
    });

    // Đủ điều kiện nếu đây là đơn hàng thứ 3, 6, 9...
    const eligible = orderCount > 0 && orderCount % 3 === 0;
    console.log(
      `Người dùng ${userId} có ${orderCount} đơn hàng. Đủ điều kiện nhận voucher: ${eligible}`
    );

    // Nếu đủ điều kiện, kiểm tra xem đã có voucher LOYAL chưa
    if (eligible) {
      // QUAN TRỌNG: CHỈ TÌM THEO userId thay vì email/phone
      // Tìm bất kỳ voucher LOYAL nào đã cấp cho người dùng này còn hiệu lực
      const existingVoucher = await MaGiamGia.magiamgia.findOne({
        magiamgia: { $regex: /^LOYAL/ },
        ngayketthuc: { $gte: new Date() },
        $or: [
          { userId: userId }, // Tìm theo userId
          { intended_users: userId }, // Tìm trong mảng intended_users với userId
        ],
      });

      if (existingVoucher) {
        console.log(
          `Người dùng ${userId} đã có voucher LOYAL còn hiệu lực: ${existingVoucher.magiamgia}`
        );
        return false;
      }
    }

    return eligible;
  } catch (error) {
    console.error("Lỗi khi kiểm tra tư cách nhận voucher đơn thứ 3:", error);
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
    console.error("Error notifying user about vouchers:", error);
    return false;
  }
}

module.exports = {
  generateVoucherForUser,
  isFirstOrderVoucherEligible,
  isThirdOrderVoucherEligible,
  notifyUserAboutVouchers,
};

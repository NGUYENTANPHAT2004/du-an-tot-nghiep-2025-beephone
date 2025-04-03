const db = require("./db");

const magiamgiaSchema = new db.mongoose.Schema({
  magiamgia: { type: String },
  soluong: { type: Number },
  sophantram: { type: Number },
  ngaybatdau: { type: Date },
  ngayketthuc: { type: Date },
  // New fields for enhanced voucher functionality
  minOrderValue: { type: Number, default: 0 }, // Minimum order value required
  maxOrderValue: { type: Number, default: null }, // Maximum order value allowed (null means no limit)
  goldenHourStart: { type: String, default: null }, // Format: "HH:MM" (24-hour format)
  goldenHourEnd: { type: String, default: null }, // Format: "HH:MM" (24-hour format)
  isServerWide: { type: Boolean, default: false }, // If true, no restriction on user limit
  appliedUsers: [{ type: String }], // Array of phone numbers that have used this voucher
  isOneTimePerUser: { type: Boolean, default: true }, // If false, same user can use multiple times
  daysOfWeek: [{ type: Number }], // 0-6 (Sunday-Saturday), empty array means all days
  isDeleted: { type: Boolean, default: false },
  intended_users: [{ type: String }], // For soft delete functionality
  deletedAt: { type: Date }, // When the voucher was soft deleted
  deletedBy: { type: String }, // Who deleted the voucher (admin username)
  deletionReason: { type: String }, // Optional reason for deletion
});

const magiamgia = db.mongoose.model("magiamgia", magiamgiaSchema);
module.exports = { magiamgia };

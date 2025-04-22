const db = require('./db');
const redemptionHistorySchema = new db.mongoose.Schema({
  userId: {
    type: db.mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Không bắt buộc vì có thể dùng email hoặc phone
  },
  phone: {
    type: String,
    required: false // Không bắt buộc vì có thể dùng userId hoặc email
  },
  email: {
    type: String,
    required: false // Thêm trường email để hỗ trợ đăng nhập social
  },
  redemptionId: {
    type: db.mongoose.Schema.Types.ObjectId,
    ref: 'PointsRedemption',
    required: true
  },
  voucherId: {
    type: db.mongoose.Schema.Types.ObjectId,
    ref: 'magiamgia',
    required: true
  },
  pointsSpent: {
    type: Number,
    required: true
  },
  voucherCode: {
    type: String,
    required: true
  },
  redemptionDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired', 'cancelled'],
    default: 'active'
  },
  usedDate: {
    type: Date
  }
});

const RedemptionHistory = db.mongoose.model('RedemptionHistory', redemptionHistorySchema);
module.exports = { RedemptionHistory };
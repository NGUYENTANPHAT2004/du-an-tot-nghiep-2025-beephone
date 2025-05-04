const db = require('./db');

const pointsRedemptionSchema = new db.mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  pointsCost: { 
    type: Number, 
    required: true 
  },
  voucherType: {
    type: String,
    enum: ['percentage', 'fixed', 'shipping', 'product'],
    required: true
  },
  voucherValue: { 
    type: Number, 
    required: true 
  },
  // Liên kết đến mã giảm giá có sẵn trong hệ thống
  voucherId: {
    type: db.mongoose.Schema.Types.ObjectId,
    ref: 'magiamgia',
    required: true
  },
  minOrderValue: { 
    type: Number, 
    default: 0 
  },
  // Tiered access - các cấp thành viên có thể truy cập phần thưởng này
  availableTiers: [{
    type: String,
    enum: ['standard', 'silver', 'gold', 'platinum']
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  limitPerUser: { 
    type: Number, 
    default: 1 
  },
  totalQuantity: { 
    type: Number, 
    default: 100 
  },
  remainingQuantity: { 
    type: Number, 
    default: 100 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  startDate: { 
    type: Date,
    default: Date.now 
  },
  endDate: { 
    type: Date,
    default: () => new Date(+new Date() + 365*24*60*60*1000) // Mặc định 1 năm
  },
  imageUrl: { 
    type: String 
  }
});

const PointsRedemption = db.mongoose.model('PointsRedemption', pointsRedemptionSchema);
module.exports = { PointsRedemption };
const db = require('./db');

const userPointsSchema = new db.mongoose.Schema({
  userId: { 
    type: db.mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  phone: { 
    type: String,
    index: true 
  },
  email: { // Thêm email để dễ dàng liên kết với user
    type: String,
    index: true
  },
  totalPoints: { 
    type: Number, 
    default: 0 
  },
  availablePoints: { 
    type: Number, 
    default: 0 
  },
  pointsHistory: [{
    amount: { type: Number },
    type: { type: String, enum: ['earned', 'redeemed', 'expired', 'adjusted'] },
    orderId: { type: db.mongoose.Schema.Types.ObjectId, ref: 'hoadon', default: null },
    voucherId: { type: db.mongoose.Schema.Types.ObjectId, ref: 'magiamgia', default: null },
    reason: { type: String },
    date: { type: Date, default: Date.now }
  }],
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  tier: {
    type: String,
    enum: ['standard', 'silver', 'gold', 'platinum'],
    default: 'standard'
  },
  yearToDatePoints: {
    type: Number,
    default: 0
  },
  // Points that will expire in the future
  expiringPoints: [{
    points: { type: Number },
    expiryDate: { type: Date }
  }]
});

// Create indexes for better query performance
userPointsSchema.index({ userId: 1 });
userPointsSchema.index({ phone: 1 });
userPointsSchema.index({ email: 1 });

const UserPoints = db.mongoose.model('UserPoints', userPointsSchema);
module.exports = { UserPoints };

// models/VoucherFailureModel.js
const db = require('./db');

const voucherFailureSchema = new db.mongoose.Schema({
  voucherCode: { 
    type: String, 
    required: true, 
    index: true 
  },
  userId: { 
    type: db.mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  phone: { 
    type: String,
    index: true  
  },
  email: { 
    type: String
  },
  orderTotal: { 
    type: Number 
  },
  reason: { 
    type: String,
    required: true
  },
  reasonDetails: { 
    type: Object 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  refundProcess: { 
    type: String, 
    enum: ['initiated', 'completed', 'failed'],
    default: 'initiated',
    index: true
  },
  refundAmount: { 
    type: Number 
  },
  refundDate: { 
    type: Date 
  },
  redemptionId: {
    type: db.mongoose.Schema.Types.ObjectId,
    ref: 'RedemptionHistory'
  },
  orderContext: { 
    type: Object 
  }
});

const VoucherFailure = db.mongoose.model('VoucherFailure', voucherFailureSchema);
module.exports = { VoucherFailure };
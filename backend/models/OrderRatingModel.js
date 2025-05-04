const db = require('./db');

const orderRatingSchema = new db.mongoose.Schema({
  userId: { type: String, required: true }, // ID của người dùng đánh giá
  orderId: { type: String, required: true }, // ID của đơn hàng
  productId: { type: String, required: true }, // ID của sản phẩm
  productName: { type: String, required: true }, // Tên sản phẩm
  productImage: { type: String }, // Ảnh sản phẩm
  tenkhach: { type: String, required: true },
  content: { type: String, default: '' },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  dungluong: { type: String }, // Dung lượng sản phẩm
  mausac: { type: String }, // Màu sắc sản phẩm
  isRead: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false } // Xác nhận đã mua hàng
});

// Indexes for better query performance
orderRatingSchema.index({ userId: 1, orderId: 1, productId: 1 }, { unique: true });
orderRatingSchema.index({ productId: 1 });
orderRatingSchema.index({ orderId: 1 });
orderRatingSchema.index({ date: -1 });

const OrderRating = db.mongoose.model('orderRating', orderRatingSchema);
module.exports = { OrderRating }; 
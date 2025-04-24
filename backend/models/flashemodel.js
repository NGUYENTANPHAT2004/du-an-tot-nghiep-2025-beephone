const db = require('./db');

const flashSaleSchema = new db.mongoose.Schema({
  name: { 
    type: String,
    required: true 
  },
  description: { 
    type: String 
  },
  startTime: { 
    type: Date,
    required: true 
  },
  endTime: { 
    type: Date,
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  bannerImage: { 
    type: String 
  },
  priority: { 
    type: Number, 
    default: 0 
  }, // Ưu tiên hiển thị trên trang chủ
  products: [{
    productId: { 
      type: db.mongoose.Schema.Types.ObjectId, 
      ref: 'chitietsp',
      required: true 
    },
    // Thêm tham chiếu đến biến thể cụ thể
    dungluongId: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: 'dungluong',
      default: null
    },
    mausacId: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: 'mausac',
      default: null
    },
    stockId: {
      type: db.mongoose.Schema.Types.ObjectId,
      ref: 'productSizeStock'
    },
    originalPrice: { 
      type: Number,
      required: true 
    },
    salePrice: { 
      type: Number,
      required: true 
    },
    discountPercent: { 
      type: Number,
      required: true 
    },
    // Số lượng dành riêng cho Flash Sale
    quantity: { 
      type: Number,
      required: true 
    },
    soldQuantity: { 
      type: Number,
      default: 0 
    },
    originalStock: { type: Number }, // Lưu trữ số lượng kho chính ban đầu (để hoàn trả)
    limit: { 
      type: Number, 
      default: 5 
    }, // Giới hạn số lượng mỗi khách hàng có thể mua
    status: { 
      type: String, 
      enum: ['available', 'soldout', 'upcoming', 'ended'],
      default: 'upcoming'
    }
  }],
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Đảm bảo cập nhật thời gian khi có sự thay đổi
flashSaleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Các index để tối ưu truy vấn
flashSaleSchema.index({ startTime: 1 });
flashSaleSchema.index({ endTime: 1 });
flashSaleSchema.index({ isActive: 1 });
flashSaleSchema.index({ 'products.productId': 1 });
flashSaleSchema.index({ 'products.dungluongId': 1 });
flashSaleSchema.index({ 'products.mausacId': 1 });
flashSaleSchema.index({ 'products.status': 1 });

flashSaleSchema.pre('save', function(next) {
  if (this.isModified('products')) {
    this.products.forEach(product => {
      if (product.soldQuantity >= product.quantity) {
        product.status = 'soldout';
      } else if (new Date() >= this.startTime && new Date() <= this.endTime) {
        product.status = 'available';
      }
    });
  }
  next();
});
const FlashSale = db.mongoose.model('FlashSale', flashSaleSchema);

module.exports = { FlashSale };
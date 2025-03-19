const db = require('./db');

const productSizeStockSchema = new db.mongoose.Schema({
  productId: { type: db.mongoose.Schema.Types.ObjectId, ref: 'chitietsp', required: true },
  dungluongId: { type: db.mongoose.Schema.Types.ObjectId, ref: 'dungluong', default: null }, // Có thể null
  mausacId: { type: db.mongoose.Schema.Types.ObjectId, ref: 'mausac', default: null }, // Có thể null
  quantity: { type: Number, default: null, min: 0 },  
  unlimitedStock: { type: Boolean, default: function() { return this.quantity === null; } },
  sku: { type: String, unique: true } // Mã SKU để quản lý sản phẩm
});
const ProductSizeStock = db.mongoose.model('productSizeStock', productSizeStockSchema);
module.exports = { ProductSizeStock };

const db = require('./db')

const hoadonSchema = new db.mongoose.Schema({
  orderId: { type: String },
  maHDL: { type: String },
  name: { type: String },
  nguoinhan : { type: String },
  phone: { type: String },
  sex: { type: String },
  giaotannoi: { type: Boolean, default: true },
  address: { type: String },
  ghichu: { type: String },
  magiamgia: { type: String },
  userId: { type: db.mongoose.Schema.Types.ObjectId, ref: 'User' },
  sanpham: [
    {
      idsp: { type: db.mongoose.Schema.Types.ObjectId, ref: 'sanpham' },
      dungluong: { type: db.mongoose.Schema.Types.ObjectId, ref: 'dungluong' },
      idmausac: { type: db.mongoose.Schema.Types.ObjectId, ref: 'mausac' },
      mausac: { type: String },
      soluong: { type: Number },
      price: { type: Number },
      productSnapshot: {
        name: { type: String },       // Tên sản phẩm tại thời điểm mua
        image: { type: String },      // Hình ảnh sản phẩm tại thời điểm mua
        dungluongName: { type: String }, // Tên dung lượng tại thời điểm mua
        mausacName: { type: String }  // Tên màu sắc tại thời điểm mua
      }
    }
  ],
  tongtien: { type: Number },
  ngaymua: { type: Date, default: Date.now },
  trangthai: { type: String, default: 'Đang xử lý' },
  thanhtoan: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
})

const hoadon = db.mongoose.model('hoadon', hoadonSchema)
module.exports = { hoadon }
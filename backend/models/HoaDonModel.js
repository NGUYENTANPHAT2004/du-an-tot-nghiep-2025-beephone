const db = require("./db");

const hoadonSchema = new db.mongoose.Schema({
  orderId: { type: String },
  maHDL: { type: String },
  name: { type: String },
  nguoinhan: { type: String },
  phone: { type: String },
  sex: { type: String },
  giaotannoi: { type: Boolean, default: true },
  address: { type: String },
  ghichu: { type: String },
  magiamgia: { type: String },
  userId: { type: db.mongoose.Schema.Types.ObjectId, ref: "User" },
  sanpham: [
    {
      idsp: { type: db.mongoose.Schema.Types.ObjectId, ref: "sanpham" },
      dungluong: { type: db.mongoose.Schema.Types.ObjectId, ref: "dungluong" },
      idmausac: { type: db.mongoose.Schema.Types.ObjectId, ref: "mausac" },
      mausac: { type: String },
      soluong: { type: Number },
      price: { type: Number },
      productSnapshot: {
        name: { type: String },
        image: { type: String },
        dungluongName: { type: String },
        mausacName: { type: String },
      },
    },
  ],
  tongtien: { type: Number },
  ngaymua: { type: Date, default: Date.now },
  trangthai: { type: String, default: "Đang xử lý" },
  thanhtoan: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
});

const hoadon = db.mongoose.model("hoadon", hoadonSchema);
module.exports = { hoadon };

const db = require('./db')

const magiamgiaSchema = new db.mongoose.Schema({
  magiamgia: { type: String },
  soluong: { type: Number },
  sophantram: { type: Number },
  ngaybatdau: { type: Date },
  ngayketthuc: { type: Date },
  isdelete: { type: Boolean, default: false }
})

const magiamgia = db.mongoose.model('magiamgia', magiamgiaSchema)
module.exports = { magiamgia }
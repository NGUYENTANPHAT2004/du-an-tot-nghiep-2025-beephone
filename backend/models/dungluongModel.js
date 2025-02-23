const db = require('./db')

const dungluongSchema = new db.mongoose.Schema({
  name: { type: String },
  mausac: [{ type: db.mongoose.Schema.Types.ObjectId, ref: 'mausac' }],
  idloaisp: { type: db.mongoose.Schema.Types.ObjectId, ref: 'loaisp' }
})

const dungluong = db.mongoose.model('dungluong', dungluongSchema)
module.exports = { dungluong }

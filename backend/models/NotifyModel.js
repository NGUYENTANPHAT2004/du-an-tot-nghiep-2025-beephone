const db = require('./db')

const notifySchema = new db.mongoose.Schema({
  tenkhach: { type: String },
  phone: { type: String },
  email: { type: String },
  cccd: { type: String },
  tensp: { type: String },
  price: { type: String },
  address: { type: String },
  isRead: { type: Boolean, default: false },
  date: { type: Date },
  isQuay: { type: Boolean, default: false }
})

const notify = db.mongoose.model('notify', notifySchema)
module.exports = { notify }

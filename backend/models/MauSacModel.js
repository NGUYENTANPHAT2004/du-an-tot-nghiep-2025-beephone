const db = require('./db')

const mausacriengSchema = new db.mongoose.Schema({
  name: { type: String },
  price: { type: String },
  image: [{ type: String }],
  isdelete: { type: Boolean, default: false }
})

const mausac = db.mongoose.model('mausac', mausacriengSchema)
module.exports = { mausac }

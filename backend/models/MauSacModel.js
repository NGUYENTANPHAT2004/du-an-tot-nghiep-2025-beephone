const db = require('./db')

const mausacriengSchema = new db.mongoose.Schema({
  name: { type: String },
  price: { type: String },
  image: [{ type: String }]
})

const mausac = db.mongoose.model('mausac', mausacriengSchema)
module.exports = { mausac }

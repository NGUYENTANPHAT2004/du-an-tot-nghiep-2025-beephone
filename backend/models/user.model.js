const db = require('./db')

const userSchema = new db.mongoose.Schema({
  username: { type: String },
  phone: { type: String },
  email: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'admin' },
  date: { type: String }
})

const User = db.mongoose.model('user', userSchema)
module.exports = { User }

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String },
  role: { type: String, default: 'user' },
  phone: { type: String, unique: true, sparse: true }, // sparse tránh lỗi nếu không có số điện thoại
  socialLogins: { // Thêm để lưu ID Google/Facebook
    google: { type: String },
    facebook: { type: String }
  }
});

const User = mongoose.model('User', userSchema);
module.exports = { User };

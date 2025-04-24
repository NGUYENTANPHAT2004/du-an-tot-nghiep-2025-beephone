const mongoose = require('mongoose');

const dungluongSchema = new mongoose.Schema({
  name: { type: String, required: true },
  idloaisp: { type: mongoose.Schema.Types.ObjectId, ref: 'loaisp' },
  mausac: [{ type: mongoose.Schema.Types.ObjectId, ref: 'mausac' }],
  isDeleted: { type: Boolean, default: false }
});

const dungluong = mongoose.models.dungluong || mongoose.model('dungluong', dungluongSchema);

module.exports = { dungluong };

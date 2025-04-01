const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  namekhongdau: { type: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  theloai: [{ type: mongoose.Schema.Types.ObjectId, ref: 'loaisp' }]
});

const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;

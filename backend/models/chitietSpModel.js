const db = require("./db");
const chitietspSchema = new db.mongoose.Schema({
  image: { type: String },
  name: { type: String },
  content: { type: String },
  price: { type: Number },
  loaisp: { type: String },
  idloaisp: { type: db.mongoose.Schema.Types.ObjectId, ref: "loaisp" },
  namekhongdau: { type: String },
  isDeleted: { type: Boolean, default: false },
});
chitietspSchema.index({ name: "text", content: "text" });
chitietspSchema.index({ namekhongdau: 1 });
chitietspSchema.index({ idloaisp: 1 });
chitietspSchema.index({ price: 1 });
const ChitietSp = db.mongoose.model("chitietsp", chitietspSchema);
module.exports = { ChitietSp };

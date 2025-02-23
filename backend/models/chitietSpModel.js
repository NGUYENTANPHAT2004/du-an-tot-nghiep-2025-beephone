const db = require("./db");

const chitietspSchema = new db.mongoose.Schema({
  image: { type: String },
  name: { type: String },
  content: { type: String },
  price: { type: String },
  loaisp: { type: String },
  idloaisp: { type: db.mongoose.Schema.Types.ObjectId, ref: "loaisp" },
  namekhongdau: { type: String },
});

const ChitietSp = db.mongoose.model("chitietsp", chitietspSchema);
module.exports = { ChitietSp };

const express = require("express");
var path = require("path");
var session = require("express-session");
var methodOverride = require("method-override");
var bodyParser = require("body-parser");
const app = express();
const MongoStore = require("connect-mongo");
var db = require("./models/db");
const mausacriengroutes = require("./routes/MauSacRiengRoutes");
const categoryrouter = require("./routes/CategoryRoutes.js");
const uri = "mongodb://localhost:27017/datn";
const dungluongroutes = require('./routes/DungLuongRoutes')
const sanphamroutes = require('./routes/SanPhamRoutes')
const loaisanphamroutes = require('./routes/LoaiSanPhamRoutes')
const userroutes = require('./routes/UserRouter')
const authroutes = require("./routes/Authroutes.js")
const stockrouter = require('./routes/stockrouter')
const jwtSecret = process.env.JWT_SECRET // Thêm fallback key
console.log(jwtSecret)
const mongoStoreOptions = {
  mongooseConnection: db.mongoose.connection,
  mongoUrl: uri,
  collection: "sessions",
};
const cors = require("cors");

app.use(cors());

app.use(
  session({
    secret: "adscascd8saa8sdv87ds78v6dsv87asvdasv8",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create(mongoStoreOptions),
    // ,cookie: { secure: true }
  })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

app.use("/", mausacriengroutes);
app.use("/", categoryrouter);
app.use('/', dungluongroutes)
app.use('/', loaisanphamroutes)
app.use('/', userroutes)
app.use('/', sanphamroutes)
app.use('/', authroutes)
app.use('/', stockrouter)
app.listen(3005, () => {
  console.log("Server is running on port 3005");
  console.log(__dirname);
});
module.exports = app;


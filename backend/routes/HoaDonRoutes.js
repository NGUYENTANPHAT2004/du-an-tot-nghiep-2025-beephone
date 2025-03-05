const express = require("express");
const router = express.Router();
const HoaDon = require("../models/HoaDonModel");
const moment = require("moment");
const SanPham = require("../models/chitietSpModel");
const DungLuong = require("../models/DungLuongModel");

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

router.get("/gethoadon", async (req, res) => {
  try {
    const hoadon = await HoaDon.hoadon.find().lean();
    res.json(hoadon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi trong quá trình xóa" });
  }
});

router.post("/settrangthai/:idhoadon", async (req, res) => {
  try {
    const idhoadon = req.params.idhoadon;
    const { trangthai } = req.body;
    const hoadon = await HoaDon.hoadon.findById(idhoadon);
    hoadon.trangthai = trangthai;
    await hoadon.save();
    res.json(hoadon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "lỗi" });
  }
});

router.get("/getchitiethd/:idhoadon", async (req, res) => {
  try {
    const idhoadon = req.params.idhoadon;

    const hoadon = await HoaDon.hoadon.findById(idhoadon);
    const hoadonsanpham = await Promise.all(
      hoadon.sanpham.map(async (sanpham) => {
        const sanpham1 = await SanPham.ChitietSp.findById(sanpham.idsp);
        const dungluong = await DungLuong.dungluong.findById(sanpham.dungluong);
        return {
          namesanpham: sanpham1.name,
          dungluong: dungluong.name,
          mausac: sanpham.mausac,
          soluong: sanpham.soluong,
          price: sanpham.price,
        };
      })
    );
    const hoadonjson = {
      name: hoadon.name,
      phone: hoadon.phone,
      sex: hoadon.sex,
      address: hoadon.address,
      ghichu: hoadon.ghichu || "",
      magiamgia: hoadon.magiamgia || "",
      ngaymua: moment(hoadon.ngaymua).format("DD/MM/YYYY"),
      thanhtoan: hoadon.thanhtoan,
      trangthai: hoadon.trangthai,
      tongtien: hoadon.tongtien,
      hoadonsanpham: hoadonsanpham,
    };
    res.json(hoadonjson);
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;

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

router.post("/deletehoaddon", async (req, res) => {
  try {
    const { ids } = req.body;
    await HoaDon.hoadon.deleteMany({ _id: { $in: ids } });
    res.json({ message: "Xóa hóa đơn thành công" });
  } catch (error) {
    console.error(error);
  }
});

router.post("/posthoadon", async (req, res) => {
  try {
    const {
      name,
      phone,
      sex,
      giaotannoi,
      address,
      ghichu,
      magiamgia,
      sanphams,
    } = req.body;

    const hoadon = new HoaDon.hoadon({
      name,
      phone,
      sex,
      giaotannoi,
      ngaymua: moment().toISOString(),
      trangthai: "Đang xử lý",
      tongtien: 0,
    });
    let tongtien = 0;

    for (const sanpham of sanphams) {
      const { idsp, soluong } = sanpham;
      const sanpham1 = await SanPham.ChitietSp.findById(idsp);
      hoadon.sanpham.push({ idsp, soluong, price: sanpham1.price });
      tongtien += sanpham1.price * soluong;
    }

    hoadon.tongtien = tongtien;

    if (magiamgia) {
      const magiamgia1 = await MaGiamGia.magiamgia.findOne({ magiamgia });
      const ngayHienTai = moment();
      const ngayKetThuc = moment(magiamgia1.ngayketthuc);

      if (ngayHienTai.isAfter(ngayKetThuc)) {
        return res.json({ message: "Mã giảm giá đã hết hạn" });
      }
      const daSuDung = await HoaDon.hoadon.findOne({ phone, magiamgia });
      if (daSuDung) {
        return res
          .status(400)
          .json({ message: "Bạn đã sử dụng mã giảm giá này" });
      }
      hoadon.magiamgia = magiamgia;
      const giamGia = magiamgia1.sophantram / 100;
      hoadon.tongtien = tongtien - tongtien * giamGia;
    }

    if (giaotannoi) {
      hoadon.address = address;
    }
    if (ghichu) {
      hoadon.ghichu = ghichu;
    }

    await hoadon.save();
    res.json(hoadon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi trong quá trình thêm" });
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

router.post("/timkiemhoadon", async (req, res) => {
  try {
    const { phone } = req.body;
    const hoadon = await HoaDon.hoadon.find({ phone });
    if (!hoadon) {
      return res.json({
        message: "Không có đơn hàng tương ứng với số điện thoại",
      });
    }
    res.json(hoadon);
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;

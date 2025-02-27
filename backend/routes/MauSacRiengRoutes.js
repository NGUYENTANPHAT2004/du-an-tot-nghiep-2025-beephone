const express = require("express");
const router = express.Router();
const MauSacRieng = require("../models/MauSacModel");
const SP = require("../models/chitietSpModel");
const uploads = require("./upload");

router.post("/postmausacrieng/:idsp", async (req, res) => {
  try {
    const idsp = req.params.idsp;
    const sanpham = await SP.ChitietSp.findById(idsp);
    const { name, price } = req.body;
    const mausacrieng = new MauSacRieng.mausacrieng({ name, price });
    sanpham.mausacrieng.push(mausacrieng._id);
    await mausacrieng.save();
    await sanpham.save();
    res.json(mausacrieng);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
  }
});

router.post(
  "/postanhmausac/:idmausac",
  uploads.array("image", 100),
  async (req, res) => {
    try {
      const idmausac = req.params.idmausac;
      const mausac = await MauSacRieng.mausac.findById(idmausac);
      const domain = "http://localhost:3005";
      const image = req.files.map((file) => `${domain}/${file.filename}`);
      mausac.image = mausac.image.concat(image);
      await mausac.save();
      res.json(mausac);
    } catch (error) {
      console.error(error);
    }
  }
);

router.get("/getanhmausac/:idmausac", async (req, res) => {
  try {
    const idmausac = req.params.idmausac;
    const mausac = await MauSacRieng.mausac.findById(idmausac);
    res.json(mausac.image);
  } catch (error) {
    console.error(error);
  }
});

router.get("/getmausacrieng/:tieude", async (req, res) => {
  try {
    const tieude = req.params.tieude;
    const sanpham = await SP.ChitietSp.findOne({ namekhongdau: tieude });
    const mausacrieng = await Promise.all(
      sanpham.mausacrieng.map(async (msr) => {
        const mausac = await MauSacRieng.mausacrieng.findById(msr._id);
        return {
          _id: mausac._id,
          name: mausac.name,
          price: mausac.price,
        };
      })
    );
    res.json(mausacrieng);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` });
  }
});

module.exports = router;

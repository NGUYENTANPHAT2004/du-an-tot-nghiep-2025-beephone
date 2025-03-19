const express = require('express')
const router = express.Router()
const MaGiamGia = require('../models/MaGiamGiaModel')
const moment = require('moment')

router.get('/getmagg', async (req, res) => {
  try {
    const magg = await MaGiamGia.magiamgia.find().lean()
    const maggjson = magg.map(mg => {
      return {
        _id: mg._id,
        magiamgia: mg.magiamgia,
        soluong: mg.soluong,
        sophantram: mg.sophantram,
        ngaybatdau: moment(mg.ngaybatdau).format('DD/MM/YYYY'),
        ngayketthuc: moment(mg.ngayketthuc).format('DD/MM/YYYY')
      }
    })
    res.json(maggjson)
  } catch (error) {
    console.error(error)
  }
})

router.post('/postmagg', async (req, res) => {
  try {
    const { soluong, sophantram, ngaybatdau, ngayketthuc } = req.body
    const magg = new MaGiamGia.magiamgia({
      soluong,
      sophantram,
      ngaybatdau,
      ngayketthuc
    })
    magg.magiamgia = 'MGG' + magg._id.toString().slice(-4)
    await magg.save()
    res.json(magg)
  } catch (error) {
    console.error(error)
  }
})
router.post('/updatemagg/:idmagg', async (req, res) => {
  try {
    const { soluong, sophantram, ngaybatdau, ngayketthuc } = req.body
    const idmagg = req.params.idmagg
    const magg = await MaGiamGia.magiamgia.findById(idmagg)
    magg.soluong = soluong
    magg.sophantram = sophantram
    magg.ngaybatdau = ngaybatdau
    magg.ngayketthuc = ngayketthuc
    await magg.save()
    res.json(magg)
  } catch (error) {
    console.error(error)
  }
})

router.post('/deletemagg', async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Danh sách ID không hợp lệ' })
    }

    await Promise.all(ids.map(id => MaGiamGia.magiamgia.findByIdAndDelete(id)))

    res.json({ message: `Đã xóa thành công ${ids.length} mã giảm giá` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi trong quá trình xóa' })
  }
})

router.get('/getchitietmagg/:idmagg', async (req, res) => {
  try {
    const idmagg = req.params.idmagg
    const magg = await MaGiamGia.magiamgia.findById(idmagg)
    res.json(magg)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi trong quá trình xóa' })
  }
})
module.exports = router
const express = require('express')
const router = express.Router()
const MauSac = require('../models/MauSacModel')
const DungLuong = require('../models/DungLuongModel')
const uploads = require('./upload')

router.post(
  '/postmausac/:iddungluong',
  uploads.array('image', 100),
  async (req, res) => {
    try {
      const iddungluong = req.params.iddungluong
      const dungluong = await DungLuong.dungluong.findById(iddungluong)
      const { name, price } = req.body
      const mausac = new MauSac.mausac({ name, price, dungluong: iddungluong })
      const domain = 'http://localhost:3005'
      const image = req.files.map(file => `${domain}/${file.filename}`)
      mausac.image = mausac.image.concat(image)
      dungluong.mausac.push(mausac._id)
      await mausac.save()
      await dungluong.save()
      res.json(mausac)
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
    }
  }
)

router.get('/mausac/:iddungluong', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong
    const dungluong = await DungLuong.dungluong.findById(iddungluong)
    const mausac = await Promise.all(
      dungluong.mausac.map(async ms => {
        const maus = await MauSac.mausac.findById(ms._id)
        return {
          _id: maus._id,
          name: maus.name,
          price: maus.price || 0
        }
      })
    )
    res.json(mausac)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post(
  '/putmausac/:idmausac',
  uploads.array('image', 100),
  async (req, res) => {
    try {
      const { name, price } = req.body
      const idmausac = req.params.idmausac
      const mausac = await MauSac.mausac.findById(idmausac)
      const domain = 'http://localhost:3005'

      const image = req.files.map(file => `${domain}/${file.filename}`)
      if (image) {
        mausac.image = mausac.image.concat(image)
      }
      mausac.name = name
      mausac.price = price
      await mausac.save()
      res.json(mausac)
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
    }
  }
)

router.post('/deletemausac/:idmausac', async (req, res) => {
  try {
    const idmausac = req.params.idmausac
    const mausac = await MauSac.mausac.findById(idmausac)
    const dungluong = await DungLuong.dungluong.findById(mausac.dungluong)
    dungluong.mausac = dungluong.mausac.filter(
      dungluong => dungluong._id.toString() !== idmausac
    )
    await MauSac.mausac.findByIdAndDelete(idmausac)
    await dungluong.save()
    res.json({ message: 'Xóa thành công' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/deletemausachangloat', async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Danh sách ID không hợp lệ' })
    }

    const mausacList = await MauSac.mausac.find({ _id: { $in: ids } })

    const dungluongIds = [...new Set(mausacList.map(mau => mau.dungluong))]

    await Promise.all(
      dungluongIds.map(async dungluongId => {
        const dungluong = await DungLuong.dungluong.findById(dungluongId)
        if (dungluong) {
          dungluong.mausac = dungluong.mausac.filter(
            id => !ids.includes(id.toString())
          )
          await dungluong.save()
        }
      })
    )

    await MauSac.mausac.deleteMany({ _id: { $in: ids } })

    res.json({ message: `Đã xóa thành công ${ids.length} màu sắc` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post(
  '/postanhmausac/:idmausac',
  uploads.array('image', 100),
  async (req, res) => {
    try {
      const idmausac = req.params.idmausac
      const mausac = await MauSac.mausac.findById(idmausac)
      const domain = 'http://localhost:3005'
      const image = req.files.map(file => `${domain}/${file.filename}`)
      mausac.image = mausac.image.concat(image)
      await mausac.save()
      res.json(mausac)
    } catch (error) {
      console.error(error)
    }
  }
)
router.get('/getanhmausac/:idmausac', async (req, res) => {
  try {
    const idmausac = req.params.idmausac
    const mausac = await MauSac.mausac.findById(idmausac)
    res.json(mausac.image)
  } catch (error) {
    console.error(error)
  }
})

router.get('/getchitietmausac/:idmausac', async (req, res) => {
  try {
    const idmausac = req.params.idmausac
    const mausac = await MauSac.mausac.findById(idmausac)
    res.json(mausac)
  } catch (error) {
    console.error(error)
  }
})

module.exports = router
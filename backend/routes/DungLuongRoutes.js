const express = require('express')
const router = express.Router()
const DungLuong = require('../models/DungLuongModel.js')
const LoaiSP = require('../models/LoaiSanPham')
const MauSac = require('../models/MauSacModel')

router.post('/postdungluong/:idloaisp', async (req, res) => {
  try {
    const idloaisp = req.params.idloaisp
    const { name } = req.body
    const loaisp = await LoaiSP.LoaiSP.findById(idloaisp)
    const dungluong = new DungLuong.dungluong({ name, idloaisp })
    loaisp.dungluongmay.push(dungluong._id)
    await dungluong.save()
    await loaisp.save()
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/editdungluong/:iddungluong', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong

    const { name } = req.body
    const dungluong = await DungLuong.dungluong.findById(iddungluong)
    dungluong.name = name
    await dungluong.save()
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/geteditdl/:id', async (req, res) => {
  try {
    const id = req.params.id
    const dungluong = await DungLuong.dungluong.findById(id)
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/dungluong/:idloaisp', async (req, res) => {
  try {
    const idloaisp = req.params.idloaisp
    const loaisp = await LoaiSP.LoaiSP.findById(idloaisp)
    const dungluong = await Promise.all(
      loaisp.dungluongmay.map(async dl => {
        const dluong = await DungLuong.dungluong.findById(dl._id)
        return {
          _id: dluong._id,
          name: dluong.name
        }
      })
    )
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/dungluongmay/:namekhongdau', async (req, res) => {
  try {
    const namekhongdau = req.params.namekhongdau
    const loaisp = await LoaiSP.LoaiSP.findOne({ namekhongdau: namekhongdau })
    const dungluong = await Promise.all(
      loaisp.dungluongmay.map(async dl => {
        const dluong = await DungLuong.dungluong.findById(dl._id)
        const mausac = await Promise.all(
          dluong.mausac.map(async ms => {
            const mausac1 = await MauSac.mausac.findById(ms._id)
            return {
              _id: mausac1._id,
              name: mausac1.name,
              price: mausac1.price,
              images: mausac1.image
            }
          })
        )
        return {
          _id: dluong._id,
          name: dluong.name,
          mausac: mausac
        }
      })
    )
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})
router.get('/getmausacgh/:iddungluong',async(req,res)=>{
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
  }
})

router.post('/deletedungluong/:iddungluong', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong

    const dungluong = await DungLuong.dungluong.findById(iddungluong)
    const loaisp = await LoaiSP.TenSP.findById(dungluong.idloaisp)

    loaisp.dungluongmay = loaisp.dungluongmay.filter(
      dungluong1 => dungluong1.toString() !== dungluong._id
    )
    await Promise.all(
      dungluong.mausac.map(async mausac => {
        await MauSac.mausac.findByIdAndDelete(mausac._id)
      })
    )
    await loaisp.save()
    await DungLuong.dungluong.findByIdAndDelete(iddungluong)
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/deletedungluonghangloat/', async (req, res) => {
  try {
    const { iddungluongList } = req.body

    if (!Array.isArray(iddungluongList) || iddungluongList.length === 0) {
      return res
        .status(400)
        .json({ message: 'Danh sách iddungluong không hợp lệ' })
    }

    const dungluongList = await DungLuong.dungluong.find({
      _id: { $in: iddungluongList }
    })

    if (!dungluongList.length) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy dung lượng nào để xóa' })
    }

    await Promise.all(
      dungluongList.map(async dungluong => {
        const loaisp = await LoaiSP.LoaiSP.findById(dungluong.idloaisp)

        if (loaisp) {
          loaisp.dungluongmay = loaisp.dungluongmay.filter(
            dungluong1 => dungluong1.toString() !== dungluong._id.toString()
          )
          await loaisp.save()
        }

        await Promise.all(
          dungluong.mausac.map(async mausac => {
            await MauSac.mausac.findByIdAndDelete(mausac._id)
          })
        )
      })
    )

    await DungLuong.dungluong.deleteMany({ _id: { $in: iddungluongList } })

    res.json({ message: 'Xóa thành công', deletedIds: iddungluongList })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

module.exports = router
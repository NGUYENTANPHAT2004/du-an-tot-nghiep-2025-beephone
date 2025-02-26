const router = require('express').Router()
const LoaiSP = require('../models/LoaiSanPham')
const Sp = require('../models/chitietSpModel')
const unicode = require('unidecode')
const Category = require('../models/CategoryModel')

function removeSpecialChars (str) {
  const specialChars = /[:+,!@#$%^&*()\-/?.\s]/g // Bao gồm cả dấu cách (\s)
  return str
    .replace(specialChars, '-') // Thay tất cả ký tự đặc biệt và dấu cách bằng dấu -
    .replace(/-+/g, '-') // Loại bỏ dấu - thừa (nhiều dấu liền nhau chỉ còn 1)
    .replace(/^-|-$/g, '') // Loại bỏ dấu - ở đầu hoặc cuối chuỗi
}

router.post('/postloaisp', async (req, res) => {
  try {
    const {
      name,
      manhinh,
      chip,
      ram,
      dungluong,
      camera,
      pinsac,
      hang,
      congsac,
      thongtin,
      category
    } = req.body
    const namekhongdau1 = unicode(name)
    const namekhongdau = removeSpecialChars(namekhongdau1)
    const cate = await Category.findById(category);
    if (!cate || cate.children.length > 0) {
      return res.status(400).json({ message: 'Danh mục này không thể chứa thể loại' });
    }
    const tensp = new LoaiSP.LoaiSP({
      name,
      manhinh,
      chip,
      ram,
      dungluong,
      camera,
      pinsac,
      hang,
      congsac,
      thongtin,
      namekhongdau,
      category: category
    })
    category.theloai.push(loaisp._id);
    await category.save();
    await tensp.save()
    res.json(tensp)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})
router.get('/theloaiadmin', async (req, res) => {
  try {
    const theloai = await LoaiSP.LoaiSP.find().lean()
    const theloaijson = await Promise.all(
      theloai.map(async tl => {
        return {
          _id: tl._id,
          name: tl.name,
          chip: tl.chip,
          ram: tl.ram,
          dungluong: tl.dungluong,
          camera: tl.camera,
          pinsac: tl.pinsac,
          hang: tl.hang,
          congsac: tl.congsac,
          khuyenmai: tl.khuyenmai
        }
      })
    )
    res.json(theloaijson)
  } catch (error) {
    console.log(error)
  }
})
module.exports = router

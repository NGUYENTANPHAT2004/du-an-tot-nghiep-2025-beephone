const express = require('express')
const router = express.Router()
const Blog = require('../models/blog.model')
const uploads = require('./upload')
const unicode = require('unidecode')
function removeSpecialChars (str) {
  const specialChars = /[:+,!@#$%^&*()\-/?.\s]/g
  return str
    .replace(specialChars, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

router.post(
  '/postblog',
  uploads.fields([{ name: 'image', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { tieude_blog, noidung } = req.body
      const domain = 'http://localhost:3005'

      const image = req.files['image']
        ? `${domain}/${req.files['image'][0].filename}`
        : null

      const tieude_khongdau1 = unicode(tieude_blog)
      const tieude_khongdau = removeSpecialChars(tieude_khongdau1)
      const blog = new Blog.blogModel({
        tieude_blog,
        tieude_khongdau,
        img_blog: image,
        noidung
      })
      await blog.save()
      res.json(blog)
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
    }
  }
)

router.post('/putblog/:idblog', async (req, res) => {
  try {
    const idblog = req.params.idblog
    const { tieude_blog, noidung } = req.body
    const tieude_khongdau1 = unicode(tieude_blog)
    const tieude_khongdau = removeSpecialChars(tieude_khongdau1)
    const blog = await Blog.blogModel.findById(idblog)
    blog.tieude_blog = tieude_blog
    blog.tieude_khongdau = tieude_khongdau
    blog.noidung = noidung
    await blog.save()
    res.json(blog)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/deleteblog/:idblog', async (req, res) => {
  try {
    const idblog = req.params.idblog
    await Blog.blogModel.findByIdAndDelete(idblog)
    res.json({ message: 'Xóa thành công' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/getblog', async (req, res) => {
  try {
    const blog = await Blog.blogModel.find().lean()
    const blogjson = blog.map(bl => {
      const ngayTao = new Date(
        parseInt(bl._id.toString().substring(0, 8), 16) * 1000
      )
      return {
        _id: bl._id,
        tieude_blog: bl.tieude_blog,
        tieude_khongdau: bl.tieude_khongdau,
        img_blog: bl.img_blog,
        noidung: bl.noidung,
        ngay_tao: ngayTao.toLocaleDateString('vi-VN') // Format dd/mm/yyyy
      }
    })
    res.json(blogjson)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/chitietblog/:tieude', async (req, res) => {
  try {
    const tieude = req.params.tieude
    const blog = await Blog.blogModel.findOne({ tieude_khongdau: tieude })
    res.json(blog)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/chitietblog1/:id', async (req, res) => {
  try {
    const id = req.params.id
    const blog = await Blog.blogModel.findById(id)
    res.json(blog)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/upload', uploads.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  const fileUrl = `http;//localhost:3005/${req.file.filename}`
  res.json({ url: fileUrl })
})

module.exports = router
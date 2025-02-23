const multer = require('multer')
const path = require('path')
const pathToUploads = path.resolve(__dirname, '../uploads')

// Cấu hình lưu trữ với tên file không trùng lặp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pathToUploads)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

// Khởi tạo multer
const upload = multer({ storage: storage })

module.exports = upload

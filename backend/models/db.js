const mongoose = require('mongoose')
const uri =
  'mongodb://localhost:27017/datn'
mongoose.connect(uri).catch(err => {
  console.log('Loi ket noi CSDL')
  console.log(err)
})
module.exports = { mongoose }

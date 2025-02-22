const mongoose = require('mongoose')
const uri =
  'mongodb+srv://baongocxink03:KD3qvAqFfpKC1uzX@cluster0.aocmw.mongodb.net/webbandienthoai?retryWrites=true&w=majority'
mongoose.connect(uri).catch(err => {
  console.log('Loi ket noi CSDL')
  console.log(err)
})
module.exports = { mongoose }

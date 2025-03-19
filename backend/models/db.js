const mongoose = require('mongoose')
const uri =
  'mongodb+srv://phat1z:123@ez88.akrq2.mongodb.net/datn?retryWrites=true&w=majority&appName=ez88'
mongoose.connect(uri).catch(err => {
  console.log('Loi ket noi CSDL')
  console.log(err)
})
module.exports = { mongoose }

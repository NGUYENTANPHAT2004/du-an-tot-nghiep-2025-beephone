const db = require('./db')

const test = new db.mongoose.Schema({
  name: { type: String }
})

const testmodel = db.mongoose.model('test', test)
module.exports = { testmodel }

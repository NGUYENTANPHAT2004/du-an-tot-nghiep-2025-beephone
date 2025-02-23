const db = require('./db');

const danhgiaSchema = new db.mongoose.Schema({
tenkhach:{type:String},
content:{type:String},
isRead: { type: Boolean, default: false },
date: { type: Date },
rating: {
    type: Number,
    required: true,
    min: 0, 
    max: 5,
},
});

const danhgia = db.mongoose.model('danhgia', danhgiaSchema);
module.exports = {danhgia};

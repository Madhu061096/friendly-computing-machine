const mongoose = require('mongoose');
const msgSchema = new mongoose.Schema({
    text:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
    }
})
const Msg = mongoose.model('msg',msgSchema);
module.exports = Msg;
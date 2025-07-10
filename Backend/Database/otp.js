const mongoose = require('mongoose')

const otpSchema = mongoose.Schema({
    email : {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    otp : {
        type : String,
        require : true,
    },
    createdAt : {
        type : Date,
        default : Date.now,
        expires : 300
    }
})

module.exports =  mongoose.model('otp',otpSchema)
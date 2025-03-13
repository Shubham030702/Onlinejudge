const mongoose = require('mongoose')

const contestSchema = new mongoose.Schema({
    contestNo: {
        type : Number,
        required :true
    },
    standings :[{
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', 
            required: true 
        },
        score : {
            type :Number,
            default : 0
        },
        penalties :{
            type :Number,
            default : 0
        },
    }],
    problems : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Problem',
    }],
    contestDate : {
        type : Date,
        required : true
    },
    starttime : {
        type : Date,
        default : ()=>{
            const now = new Date();
            now.setHours(20, 0, 0, 0); 
            return now;
        },
    },
    endtime : {
        type : Date,
        default : ()=>{
            const now = new Date();
            now.setHours(21, 0, 0, 0); 
            return now;
        },
    },
    status : String,
})

const contest = mongoose.model('Contest',contestSchema)

module.exports=contest;
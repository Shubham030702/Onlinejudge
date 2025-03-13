const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  Problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem', 
    required: true
  },  
  Status :{
    type : String,
    required:true,
  },
  Time : {
    type : Date,
    default : Date.now
  },
  Solution:{
    type : String,
    required :true
  }
})

const userSchema = new mongoose.Schema({
  Username: {
    type: String,
    required: true,
    unique: true
  },
  Email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  Password: {
    type: String,
    required: true,
    minlength: 6,
  },
  Submissions:{
    type: [submissionSchema],
  },
  Rating:{
    type : Number,
    default : 1500
  }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

module.exports = User;

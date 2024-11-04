const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true, 
  },
  output: {
    type: String,
    required: false,
  },
});

const submissionsSchema = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  Username:{
    type:String,
    required:true,
  },
  Status:{
    type:String,
    required:true
  },
  Solution:{
    
  },
  Time:{
    type : Date,
    default : Date.now
  }
})

const problemSchema = new mongoose.Schema({
  problemName: {
    type: String,
    required: true, 
  },
  difficulty: {
    type: String,
    required: true, 
  },
  topics: {
    type: [String], 
    required: true, 
  },
  statement: {
    type: String,
    required: true, 
  },
  testCases: {
    type: [testCaseSchema],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  editorials:{
    type:String,
  },
  users:{
    type: [submissionsSchema],
    required: true
  }
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;

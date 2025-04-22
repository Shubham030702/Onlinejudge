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
    type:String,
    required:true
  },
  Time:{
    type : Date,
    default : Date.now
  }
})

const boilerplateSchema = new mongoose.Schema({ 
  cpp: {
    type: String,
    required: true, 
  },
  python: {
    type: String,
    required: true, 
  },
  java: {
    type: String,
    required: true, 
  },
  js: {
    type: String,
    required: true, 
  }
});

const boilerplateFullSchema = new mongoose.Schema({ 
  cpp: {
    type: String,
    required: true, 
  },
  python: {
    type: String,
    required: true, 
  },
  java: {
    type: String,
    required: true, 
  },
  js: {
    type: String,
    required: true, 
  }
});

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
  },
  boilerplate: {
    type: boilerplateSchema,
    required: true,
  },
  boilerplateFull: {
    type: boilerplateFullSchema,
    required: true,
  },
  contestOnly :{
    type : Boolean,
    default : false
  },
  contestId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'contest', 
  }
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;

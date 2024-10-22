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
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;

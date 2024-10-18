const mongoose = require('mongoose');

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
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;

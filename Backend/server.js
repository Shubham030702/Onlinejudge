const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const Problem = require('../src/Database/problems'); 
const User = require('../src/Database/user');
const app = express();
const PORT = process.env.PORT || 5000;
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/ProblemStatements', { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/api/problems', async (req, res) => {
  try {
    const problems = await Problem.find();
    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/problem/:id', async (req, res) => {
  console.log(req.params.id);
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/signup',async(req,res)=>{
  const {Email,Username,Password} = req.body;
  try {
    const existingUser = await User.findOne({Username });
    const existingEmail = await User.findOne({Email });
    if (existingUser) {
      return res.status(500).json({ message: 'Username is already taken!' });
    }
    if (existingEmail) {
      return res.status(500).json({ message: 'Email is already taken!' });
    }
    const hashpassword = await bcrypt.hash(Password,10);
    const newUser = new User({ Username, Email, Password:hashpassword});
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: error.message });
  }
})

app.post('/api/login',async(req,res)=>{
    const {Email,Password} = req.body;
    console.log(Email)
    try{
      const useremail = await User.findOne({Email});
      if(!useremail){
        return res.status(500).json({ message: 'Email is Not registered!! SignUp!' });
      }
      bcrypt.compare(Password,useremail.Password,function(err, isMatch) {
        if (err){
          alert('Incorrect Password')
        }
        if (isMatch) {
          res.status(201).json({ message: 'User loggedin successfully' });
        } else {
          return response.json({success: false, message: 'passwords do not match'});
        }
    });
  }catch(error){
    res.status(500).json({ message: error.message });
  }
})  

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

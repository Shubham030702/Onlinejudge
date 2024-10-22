const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();
const PORT = process.env.PORT || 5000;
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieparser = require('cookie-parser');
require('dotenv').config();

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true, 
}));

app.use(bodyParser.json());
app.use(express.json());
app.use(cookieparser());

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false ,
    maxAge: 1000*60*60*24 
  }
}))

let Problem,User;
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000
})
.then(() => {
  Problem = require('./Database/problems'); 
  User = require('./Database/user');
})
.catch((error) => {
  console.error("Error connecting to the database:", error);
});


const db = mongoose.connection;

db.on('connected', () => {
  console.log('Connected to MongoDB successfully');
});

db.on('error', (err) => {
  console.log('Error connecting to MongoDB:', err.message);
});

const isLoggedIn = (req, res, next) => {
  if (req.session.views !== undefined) {
      return next(); 
  } else {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
};

app.get('/api/problems',async (req, res) => {
    try {
      req.session.views++;
      const problems = await Problem.find();
      res.json(problems);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

app.get('/api/problem/:id', async (req, res) => {
  try {
    req.session.views++;
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/signup', async(req,res)=>{
  const {Email,Username,Password} = req.body;
  try {
    const existingUser =  await User.findOne({Username });
    const existingEmail =  await User.findOne({Email });
    if (existingUser) {
      return res.status(409).json({ message: 'Username is already taken!' });
    }
    if (existingEmail) {
      return res.status(409).json({ message: 'Email is already taken!' });
    }
    const hashpassword = await bcrypt.hash(Password,10);
    const newUser = new User({ Username, Email, Password:hashpassword});
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ message: error.message });
  }
})

app.post('/api/login',async(req,res)=>{
    const {Email,Password} = req.body;
    if (req.session.views) {
      return res.status(400).json({ message: 'User already logged in!' });
    }
    try{
      console.log(Email);
      const useremail = await User.findOne({Email:Email});
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

app.post('/api/submission',async(req,res)=>{
  const {Problem} = req.body;
  
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

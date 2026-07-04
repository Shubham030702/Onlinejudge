const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const User = require('../Database/user');
const otpModel = require('../Database/otp');
const { isLoggedIn } = require('../middleware/authMiddleware');

const router = express.Router();

const otpSender = async(email,otp)=>{
  const transporter = nodemailer.createTransport({
    service : 'gmail',
        auth : {
            user : process.env.Email,
            pass :  process.env.PassEmail,
        }
  });
    const info = await transporter.sendMail({
      from: '"AceCode"',
      to: email,
      subject: "Authentication to AceCode via OTP",
      text: "Hello User",
      html: `<h2>🔐 AceCode OTP Verification</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <h3 style="color: #2e86de;">${otp}</h3>
      <p>This code will expire in <strong>5 minutes</strong>.</p>
      <p>Please do not share this OTP with anyone.</p>
      <br>
      <p>— Team AceCode</p>`, 
    });
    console.log("Message sent:", info.messageId);
}

router.get('/api/checkUser',(req,res)=>{
  if (req.session.user) {  
    return res.json({Success:true,message:"User was already logged in!"}) 
  } 
  return res.json({Success:false,message:"User was not already logged in!"}) 
})

router.post('/api/otpManager',async(req,res)=>{
    const {email} = req.body;
    try{
      const exist = await User.findOne({Email : email})
      if(exist){
        return res.send({success:false,message:"This Email is already in use!"})
      }
      await otpModel.deleteMany({email})
      const otpgenerated = Math.floor(100000 + Math.random() * 900000).toString();  
      const newOtp = new otpModel({
        email : email,
        otp : otpgenerated
      })
      await newOtp.save();
      await otpSender(email,otpgenerated)
      res.send({success:true, message : "Otp sent successfully"})
    }
    catch(error){
      res.send({success:false,message :error})
    }
})

router.post('/api/otpVerify',async(req,res)=>{
    const {email,otp} = req.body;
    try{
      const result = await otpModel.findOne({email});
      if(otp === result.otp){
        res.send({success:true,message:"Otp is verified!"})
      }
      else{
        res.send({success:false,message:"Incorrect Otp!"})
      }
    }catch(error){
      res.send({success:false,message:error})  
    }
})

router.post('/api/signup', async(req, res) => {
  const { Email, Username, Password } = req.body;
  try {
    const existingUser = await User.findOne({ Username });
    const existingEmail = await User.findOne({ Email });
    if (existingUser || existingEmail) {
      return res.status(409).json({ message: 'Username or Email already taken!' });
    }
    const hashPassword = await bcrypt.hash(Password, 10);

    const newUser = new User({ Username, Email, Password: hashPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/api/login', async (req, res) => {
  const { Email, Password } = req.body;
  try {
    const useremail = await User.findOne({ Email });
    if (!useremail) {
      return res.status(500).json({ message: 'Email is not registered! Please sign up.' });
    }
    bcrypt.compare(Password, useremail.Password, function(err, isMatch) {
      if (err || !isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
      req.session.user = {
        id: useremail._id,
        submission: useremail.Submissions
      };
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ message: 'Session save failed' });
        }
        res.status(201).json({ message: 'User logged in successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("error");
  }
});

router.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to log out.');
    }
    res.clearCookie('connect.sid'); 
    res.status(200).json({ message: 'User logged out' });
  });
});

router.get('/api/userdata', async(req,res)=>{
  const response = await User.findById(req.session.user.id).populate({
    path: 'Submissions.Problem',
  })
  .select('-Password');
  if(response) res.json(response)
  else res.status(401).json({ message: 'user not found'});
})

router.get('/api/leaderboard', async(req,res)=>{
  try{
    const response = await User.find({},"Username Rating").sort({Rating:-1}).lean();
    const UserRank = await response.findIndex(user=>user._id.toString()===req.session.user.id)+1
    res.json({response,rank:UserRank})
  }catch(error){
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
})

router.get('/profile', async(req,res)=>{
  try{
    const response = await User.findById(req.session.user.id).populate('Submissions');
    res.json(response)
  }catch{
    res.status(500).send({ error: "An error occurred while Extracting the data." });
  }
})

module.exports = router;

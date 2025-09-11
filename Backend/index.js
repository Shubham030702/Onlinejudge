const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();
const PORT = process.env.PORT || 5000;
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo'); 
require('dotenv').config();
const CodeSubmission = require('./judge0');
const scheduler = require('./ProblemAdder/contestScheduler')

scheduler.startContestCron();

app.use(session({
  secret: process.env.SecretKey,             
  resave: false,                
  saveUninitialized: false,     
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI, 
    ttl: 24 * 60 * 60 
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, 
    httpOnly: true,
    secure : false
  }
}));

app.use(cors({
  origin: 'https://acecodecp.netlify.app/', 
  credentials: true, 
}));

app.use(express.json());

let Problem, User, Contest;
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 })
  .then(() => {
    Problem = require('./Database/problems'); 
    User = require('./Database/user');
    Contest = require('./Database/contest');
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


function isLoggedIn(req, res, next) {
  if (req.session.user) {  
    next(); 
  } else {
    res.status(401).send('Please log in to access this resource.');
  }
}

app.get('/api/checkUser',(req,res)=>{
  if (req.session.user) {  
    res.json({Success:true,message:"User was already logged in!"}) 
  } else {
    res.json({Success:false,message:"User was not already logged in!"}) 
  }
})

app.get('/api/problems',isLoggedIn, async (req, res) => {
  try {
    const problems = await Problem.find({contestOnly : false});
    if (!problems) {
      return res.status(404).json({ message: "No problems found" });
    }
    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/problem/:id',isLoggedIn, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).populate('users');
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/contest',isLoggedIn, async (req, res) => {
  try {
    const contest = await Contest.find();
    res.json(contest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/contest/:id', isLoggedIn, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate('problems').populate('standings.user');
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    console.log(req.session.user);
    console.log(contest.standings);
    const userStanding = contest.standings.find(
      (entry) => entry.user._id.toString() === req.session.user.id
      );
      console.log("this is user standing",userStanding);
      res.json({contest,userStanding});
    } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.get('/api/contestRegistration/:id', isLoggedIn, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate('problems').populate('standings');
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    const data = {
      user : new mongoose.Types.ObjectId(req.session.user.id),
      score : 0,
      penalties : 0
    }
    contest.standings.push(data)
    await contest.save()
    res.json({ message: "User registered successfully", contest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const nodemailer = require('nodemailer')
const otpModel = require('./Database/otp')

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

app.post('/api/otpManager',async(req,res)=>{
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

app.post('/api/otpVerify',async(req,res)=>{
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

app.post('/api/signup', async(req, res) => {
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

app.get('/api/userdata',async(req,res)=>{
  const response = await User.findById(req.session.user.id).populate({
    path: 'Submissions.Problem',
  })
  .select('-Password');
  if(response) res.json(response)
  else res.status(401).json({ message: 'user not found'});
})

app.get('/api/leaderboard',async(req,res)=>{
  try{
    const response = await User.find({},"Username Rating").sort({Rating:-1}).lean();
    const UserRank = await response.findIndex(user=>user._id.toString()===req.session.user.id)+1
    res.json({response,rank:UserRank})
  }catch(error){
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
})

app.post('/api/login', async (req, res) => {
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
        id: useremail._id
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

app.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to log out.');
    }
    res.clearCookie('connect.sid'); 
    res.status(200).json({ message: 'User logged out' });
  });
});

const submission = new CodeSubmission()

function base64code(code){
  const base64 = Buffer.from(code).toString('base64');
  return base64
}

app.get('/profile',async(req,res)=>{
  try{
    const response = await User.findById(req.session.user.id).populate('Submissions');
    res.json(response)
  }catch{
    res.status(500).send({ error: "An error occurred while Extracting the data." });
  }
})

app.post('/api/Contestsubmission',async(req,res)=>{
  const {ProblemName,Language,Code} = req.body.problemdesc
  const problem = await Problem.findOne({problemName:ProblemName});
  const userdata = await User.findById(req.session.user.id);
  if (!problem || !userdata) {
    return res.status(404).json({ error: "Problem, contest, or user not found." });
  }
  const alreadySubmitted = userdata.Submissions.some(sub => sub.Problem.equals(problem._id));
  const inputs = []
  const outputs = []
  problem.testCases.forEach(e=>{
    inputs.push(e.input)
    outputs.push(e.output)
  })
  const code64 = base64code(Code)
  async function evaluateSubmissions() {
    let Time=0;
    for (const [index, input] of inputs.entries()) {
      const output = outputs[index];
      const code64inp = base64code(input);
      const code64out = base64code(output);
      try {
        const result = await submission.evaluation(code64inp,Language,code64out, code64);
        const decode = Buffer.from(result.stdout,'base64').toString('utf-8');
        let d = parseFloat(result.time);
        Time+=d;
        if(result.status.id > 3){
          if (!alreadySubmitted) {
            await Contest.findOneAndUpdate(
              { _id: problem.contestId, "standings.user": new mongoose.Types.ObjectId(req.session.user.id) },
              { 
                $inc: { "standings.$.penalties": 1 },
              },
              { new: true }
            );            
          }
          return {result,output,input,decode}
        }
      } catch (error) {
        if (!alreadySubmitted) {
          await Contest.findOneAndUpdate(
            { _id: problem.contestId, "standings.user": new mongoose.Types.ObjectId(req.session.user.id) },
            { 
              $inc: { "standings.$.penalties": 1 },
            },
            { new: true }
          );            
        }
        return {status:"Runtime Error",time:Time};
      } 
    }
    if (!alreadySubmitted) {
      await Contest.findOneAndUpdate(
        { _id: problem.contestId, "standings.user": new mongoose.Types.ObjectId(req.session.user.id) },
        { 
          $inc: { "standings.$.score": 1 },
        },
        { new: true }
      );            
    }
    return {status:"Accepted",time:Time};
  }
  try {
    const result = await evaluateSubmissions();
    if(result.status === "Accepted"){
      userdata.Submissions.push({
        Problem:problem._id,
        Status:result.result?result.result.status.description:result.status,
        Solution:Code
      })
    }
    await userdata.save()
    problem.users.push({
      user: req.session.user.id,
      Username: userdata.Username,
      Status:result.result?result.result.status.description:result.status,
      Solution:Code
    })
    await problem.save()
    res.send(result);
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: "An error occurred while evaluating submissions." });
  }
})

app.post('/api/submission',async(req,res)=>{
  const {ProblemName,Language,Code} = req.body.problemdesc
  const problem = await Problem.findOne({problemName:ProblemName});
  const userdata = await User.findById(req.session.user.id);
  if (!problem || !userdata) {
    return res.status(404).json({ error: "Problem, contest, or user not found." });
  }
  const inputs = []
  const outputs = []
  problem.testCases.forEach(e=>{
    inputs.push(e.input)
    outputs.push(e.output)
  })
  const code64 = base64code(Code)
  async function evaluateSubmissions() {
    let Time=0;
    for (const [index, input] of inputs.entries()) {
      const output = outputs[index];
      const code64inp = base64code(input);
      const code64out = base64code(output);
      try {
        const result = await submission.evaluation(code64inp,Language,code64out, code64);
        const decode = Buffer.from(result.stdout,'base64').toString('utf-8');
        let d = parseFloat(result.time);
        Time+=d;
        if(result.status.id > 3){
          return {result,output,input,decode}
        }
      } catch (error) {        
        return {status:"Runtime Error",time:Time};
      } 
    }
    return {status:"Accepted",time:Time};
  }
  try {
    const result = await evaluateSubmissions();
    userdata.Submissions.push({
      Problem:problem._id,
      Status:result.result?result.result.status.description:result.status,
      Solution:Code
    })
    await userdata.save()
    problem.users.push({
      user: req.session.user.id,
      Username: userdata.Username,
      Status:result.result?result.result.status.description:result.status,
      Solution:Code
    })
    await problem.save()
    res.send(result);
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: "An error occurred while evaluating submissions." });
  }
})

app.post('/api/runprob',async(req,res)=>{
  const {id,Language,LanguageName,Code} = req.body.problemdesc
  const problem = await Problem.findOne({_id:id});
  const inputs = []
  const outputs = []
  problem.testCases.splice(0,2).forEach(e=>{
    inputs.push(e.input)
    outputs.push(e.output)
  })
  const boilerplate = problem.boilerplateFull[LanguageName];
  const FullCode = boilerplate.replace("## Enter Code Here ##",Code)
  console.log(FullCode)
  const code64 = base64code(FullCode)
  async function evaluateSubmissions() {
    let Time=0;
    for (const [index, input] of inputs.entries()) {
      const output = outputs[index];
      const code64inp = base64code(input);
      const code64out = base64code(output);
      try {
        const result = await submission.evaluation(code64inp,Language, code64out, code64);
        const decode = Buffer.from(result.stdout,'base64').toString('utf-8');
        let d = parseFloat(result.time);
        Time+=d;
        if(result.status.id > 3){
          return {result,output,input,decode}
        }
      } catch (error) {
        return {status:"Runtime Error",time:Time};
      }
    }
    return {status:"Accepted",time:Time};
  }
  try {
    const result = await evaluateSubmissions();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "An error occurred while evaluating submissions." });
  }
})

app.listen(PORT, () => {   
  console.log(`Server is running on port ${PORT}`);
});

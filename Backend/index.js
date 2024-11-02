const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();
const PORT = process.env.PORT || 5000;
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo'); 
require('dotenv').config();
const CodeSubmission = require('./judge0')

app.use(session({
  secret: 'secret',             
  resave: false,                
  saveUninitialized: false,     
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI, 
    ttl: 24 * 60 * 60 
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, 
    httpOnly: true
  }
}));

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true, 
}));

app.use(express.json());

let Problem, User;
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 })
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


function isLoggedIn(req, res, next) {
  if (req.session.user) {  
    return next(); 
  } else {
    res.status(401).send('Please log in to access this resource.');
  }
}

app.get('/api/problems',isLoggedIn, async (req, res) => {
  try {
    const problems = await Problem.find();
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
  console.log(response)
  if(response) res.json(response)
  else res.status(401).json({ message: 'user not found'});
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
        id: useremail._id,
        username: useremail.Username
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
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to log out.');
    }
    res.clearCookie('connect.sid'); 
    console.log('User logged out successfully');
    res.status(200).json({ message: 'User logged out' });
  });
});

const submission = new CodeSubmission()

function base64code(code){
  const base64 = Buffer.from(code).toString('base64');
  return base64
}

app.post('/api/submission',async(req,res)=>{
  const {ProblemName,Code} = req.body.problemdesc
  // storing submission in the database

  // checking the problem in the database and taking out the testcases

  const problem = await Problem.findOne({problemName:ProblemName});
  const inputs = []
  const outputs = []
  problem.testCases.forEach(e=>{
    inputs.push(e.input)
    outputs.push(e.output)
  })

  // Judge 0 checking code's evaluation
  const code64 = base64code(Code)
  async function evaluateSubmissions() {
    for (const [index, input] of inputs.entries()) {
      const output = outputs[index];
      const code64inp = base64code(input);
      const code64out = base64code(output);
      try {
        const result = await submission.evaluation(code64inp, code64out, code64);
        const decode = Buffer.from(result.stdout,'base64').toString('utf-8');
        if(result.status.id > 3){
          return {result,output,input,decode}
        }
      } catch (error) {
        console.error("Error in submission for index:", index, error);
      }
    }
    return 0;
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

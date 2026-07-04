const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();
const PORT = 5000;
const session = require('express-session');
const MongoStore = require('connect-mongo'); 
require('dotenv').config();
const scheduler = require('./ProblemAdder/contestScheduler')

// Import routers
const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problem');
const contestRoutes = require('./routes/contest');

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
  origin: 'http://localhost:3000', 
  credentials: true, 
}));

app.options('*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Register routes
app.use('/', authRoutes);
app.use('/', problemRoutes);
app.use('/', contestRoutes);

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 })
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

app.listen(PORT, () => {   
  console.log(`Server is running on port ${PORT}`);
});

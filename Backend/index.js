// Active connection comment for nodemon auto-restart
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

const clientPromise = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 })
  .then(m => {
    return m.connection.getClient();
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
    return null;
  });

app.use(session({
  secret: process.env.SecretKey,             
  resave: false,                
  saveUninitialized: false,     
  store: MongoStore.create({
    clientPromise: clientPromise,
    ttl: 24 * 60 * 60 
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, 
    httpOnly: true,
    secure : false
  }
}));

const allowedOrigins = [
  'http://localhost:3000',
  'https://acecodecp.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins, 
  credentials: true, 
}));

app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

// Register routes
app.use('/', authRoutes);
app.use('/', problemRoutes);
app.use('/', contestRoutes);

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

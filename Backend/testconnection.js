const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/ProblemStatements';

async function testConnection() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

db.bios.findOne(
    {
      $or: [
             { 'name.first' : /^G/ },
             { birth: { $lt: new Date('01/01/1945') } }
           ]
    }
 )

testConnection();
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env' });
const client = new MongoClient(process.env.MONGODB_URI);
const dbName = 'users';
const problemAdder = require('./problemAdder');
const readline = require('readline');
let ContestId = "";

async function contestProblem(date,time) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const contsize = await db.collection('contests').countDocuments()
    const contestCollection = db.collection('contests')
    const dateTimeStr = `${date}T${time}:00`;
    const contestISODate = new Date(dateTimeStr);
    const start = new Date(contestISODate); 
    const end = new Date(contestISODate);
    end.setMinutes(end.getMinutes() + 90);
    const contestDate = contestISODate.toISOString();
    const startiso = start.toISOString();
    const endiso = end.toISOString();
    const contestData = {
      contestNo : contsize+1,
      standings : [],
      problems : [],
      contestDate : contestDate,
      starttime : startiso,
      endtime : endiso,
      status : "Upcoming",
      processed : false
    }
    const result = await contestCollection.insertOne(contestData);
    ContestId = result.insertedId;
    console.log(`New contest created with id: ${result.insertedId}`);
  } catch (error) {
    console.error('Error creating contest:', error);
  } finally {
    await client.close();
  }
}

async function Addproblems(dirs){
  try{
    const dirArray = Array.isArray(dirs) ? dirs : dirs.split(',').map(d => d.trim());
    for(const dir of dirArray){
      await problemAdder(dir,ContestId);
    }
    console.log("All the problems are added to the contest");
  }catch(error){
    console.log("Cant add the problems ",error);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, answer => resolve(answer)));
}

(async () => {
  const date = await askQuestion('Enter contest date (YYYY-MM-DD) Add date as 7==>07:: ');
  const time = await askQuestion('Enter contest time (HH:MM in 24hr format)  Add time as 7==>07: ');
  const currTime = new Date();
  const contdate = new Date(`${date}T${time}:00`);
  if(currTime > contdate){
    throw new Error("Schedule time is in the past please schedule contest for the future");
  }
  const dirs = await askQuestion('Enter problem directory paths (comma-separated): ');
  await contestProblem(date,time)
  await Addproblems(dirs)
  rl.close();
})();

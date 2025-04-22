const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env' });
const client = new MongoClient(process.env.MONGODB_URI);
const dbName = 'users';

async function contestProblem(date) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const contsize = await db.collection('contests').countDocuments()
    const contestCollection = db.collection('contests')
    const contestISODate = new Date(date);
    const start = new Date(contestISODate)
    start.setUTCHours(20,0,0,0);
    const end = new Date(contestISODate)
    end.setUTCHours(21,0,0,0);
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
    }
    const result = await contestCollection.insertOne(contestData);
    console.log(`New contest created with id: ${result.insertedId}`);
  } catch (error) {
    console.error('Error creating contest:', error);
  } finally {
    await client.close();
  }
}

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: node contestProblem.js <date>');
  process.exit(1);
}

const date = args[0]

contestProblem(date);

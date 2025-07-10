const cron = require('node-cron');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.MONGODB_URI);
const dbname = 'users';

async function initDbConnection() {
  if (!client.topology && !client.topology?.isConnected()) {
    await client.connect();
  }
  return client.db(dbname);
}

function startContestCron() {
  cron.schedule('* * * * *', async () => {
    const now = new Date().toISOString();
    try {
      const db = await initDbConnection();
      const contests = await db.collection('contests').find({
        starttime: { $lte: now },
        status: "Upcoming"
      }).toArray();

      for (const contest of contests) {
        await db.collection('contests').updateOne(
          { _id: contest._id },
          { $set: { status: "Running" } }
        );
        console.log(`Contest ${contest.contestNo} is now Running`);
      }

      await db.collection('contests').updateMany({
        endtime: { $lte: now },
        status: "Running"
      }, { $set: { status: "Ended" } });

      const endedcontests = await db.collection('contests').find({
        endtime: { $lte: now },
        status: "Ended",
        processed : false
      }).toArray();

      for(const cont of endedcontests){
        await db.collection('problems').updateMany(
          {contestId:cont._id},
          {$set : {contestOnly : false}},
        )
      }
      await db.collection('contests').updateMany({
        endtime: { $lte: now },
        status: "Ended",
        processed : false
      }, { $set: { processed: true } });

    } catch (err) {
      console.error('Cron job error:', err);
    } 
  });
}

module.exports = {startContestCron};

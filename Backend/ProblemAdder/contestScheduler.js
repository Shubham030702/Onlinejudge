const cron = require('node-cron');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.MONGODB_URI);
const dbname = 'users';

function startContestCron() {
  cron.schedule('* * * * *', async () => {
    try {
      await client.connect();
      const db = client.db(dbname);
      const now = new Date().toISOString();

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

    } catch (err) {
      console.error('Cron job error:', err);
    } finally {
      await client.close();
    }
  });
}

module.exports = {startContestCron};

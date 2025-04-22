const {MongoClient,ObjectId} = require('mongodb')
const cron =  require('node-cron')
require('dotenv').config({ path: '../.env' });

const client = new MongoClient(process.env.MONGODB_URI)
const dbname = 'users'

async function contestScheduler(id){
    try{
        await client.connect();
        const db = client.db(dbname);
        const contests = db.collection('contests').findOne({_id : new ObjectId(id)});
        const now = new Date();
        const updatedOngoing = await contests.updateMany(
            { starttime: { $lte: now }, status: "Upcoming" },
            { $set: { status: "Ongoing" } }
        );
        const updatedEnded = await contests.updateMany(
            { endtime: { $lte: now }, status: "Ongoing" },
            { $set: { status: "Ended" } }
        );
        console.log(`Updated ${updatedOngoing.modifiedCount} contests to "ongoing".`);
        console.log(`Updated ${updatedEnded.modifiedCount} contests to "ended".`);    
    }catch(error){
        console.error('Error updating the contest :',error)
    }finally{
        await client.close()
    }
}

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: node contestScheduler.js <id>');
  process.exit(1);
}

const id = args[0]

cron.schedule("* * * * *", async () => {
    console.log("Running contest status update...");
    await contestScheduler(id);
});

console.log("Contest scheduler started...");

const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '../.env' });

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = 'users';

async function problemAdder(problemDir, contestId) {
  try {
    await client.connect();
    const db = client.db(dbName);
    
    const contestCollection = db.collection('contests');
    const contest = await contestCollection.findOne({ _id: new ObjectId(contestId) });
    if (!contest) {
      console.error('Contest not found!');
      return;
    }

    const problemCollection = db.collection('problems');

    const description = fs.readFileSync(path.join(problemDir, 'Structure.md'), 'utf-8');
    const lines = description.split('\n');

    let problemname = "", difficulty = "", topic = [];

    lines.forEach(line => {
      if (line.startsWith('Problem Name:')) {
        problemname = line.replace('Problem Name:', '').trim();
      } else if (line.startsWith('Difficulty :')) {
        difficulty = line.replace('Difficulty :', '').trim();
      } else if (line.startsWith('Topic :')) {
        topic = line.replace('Topic :', '').trim().split(',').map(t => t.trim());
      }
    });

    const problemStatement = fs.readFileSync(path.join(problemDir, 'Problem.md'), 'utf-8');
    const Editorial = fs.readFileSync(path.join(problemDir, 'Editorial.md'), 'utf-8');

    const testCases = [];
    const inputFiles = fs.readdirSync(path.join(problemDir, 'tests', 'inputs'));

    inputFiles.forEach((inputFile, index) => {
      const inputFilePath = path.join(problemDir, 'tests', 'inputs', inputFile);
      const outputFilePath = path.join(problemDir, 'tests', 'outputs', `${index}.txt`);
      const input = fs.readFileSync(inputFilePath, 'utf-8');
      const output = fs.existsSync(outputFilePath) ? fs.readFileSync(outputFilePath, 'utf-8') : null;

      testCases.push({ input, output });
    });

    const problemData = {
      problemName: problemname,
      difficulty: difficulty,
      topics: topic,
      statement: problemStatement,
      testCases: testCases,
      editorial: Editorial,
      users: [],
      createdAt: new Date(),
      contestOnly: true,
      contestId: new ObjectId(contestId)
    };
    const result = await problemCollection.insertOne(problemData);
    console.log(`New problem created with id: ${result.insertedId}`);

    await contestCollection.updateOne(
      { _id: new ObjectId(contestId) },
      { $push: { problems: result.insertedId } }
    );

    console.log(`Problem added to contest ${contestId}`);

  } catch (error) {
    console.error('Error storing problem:', error);
  } finally {
    await client.close();
  }
}

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node storeProblem.js <problemDir> <contestId>');
  process.exit(1);
}

const problemDir = args[0];
const contestId = args[1];

problemAdder(problemDir, contestId);

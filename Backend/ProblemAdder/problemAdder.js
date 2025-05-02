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

    const boilerplateDir = path.join(problemDir, 'BoilerPlate');
    const boilerplateFullDir = path.join(problemDir, 'BoilerPlateFull');
    const cppFilePath = path.join(boilerplateDir, 'boilerplate.cpp');
    const pythonFilePath = path.join(boilerplateDir, 'boilerplate.py');   
    const javaFilePath = path.join(boilerplateDir, 'boilerplate.java');
    const jsFilePath = path.join(boilerplateDir, 'boilerplate.js');
    const cppCode = fs.readFileSync(cppFilePath, 'utf-8');  
    const pythonCode = fs.readFileSync(pythonFilePath, 'utf-8');
    const javaCode = fs.readFileSync(javaFilePath, 'utf-8');
    const jsCode = fs.readFileSync(jsFilePath, 'utf-8');
    const cppFilePath2 = path.join(boilerplateFullDir, 'boilerplate.cpp');
    const pythonFilePath2 = path.join(boilerplateFullDir, 'boilerplate.py');   
    const javaFilePath2 = path.join(boilerplateFullDir, 'boilerplate.java');
    const jsFilePath2 = path.join(boilerplateFullDir, 'boilerplate.js');
    const cppFullCode = fs.readFileSync(cppFilePath2, 'utf-8');  
    const pythonFullCode = fs.readFileSync(pythonFilePath2, 'utf-8');
    const javaFullCode = fs.readFileSync(javaFilePath2, 'utf-8');
    const jsFullCode = fs.readFileSync(jsFilePath2, 'utf-8');
    const boilerplate = {
      cpp: cppCode,
      python: pythonCode,
      java: javaCode,
      js: jsCode
    };
    const boilerplateFull = {
      cpp: cppFullCode,
      python: pythonFullCode,
      java: javaFullCode,
      js: jsFullCode
    };

    const problemData = {
      problemName: problemname,
      difficulty: difficulty,
      topics: topic,
      statement: problemStatement,
      testCases: testCases,
      editorial: Editorial,
      users: [],
      boilerplate: boilerplate,
      boilerplateFull: boilerplateFull,
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

module.exports = problemAdder

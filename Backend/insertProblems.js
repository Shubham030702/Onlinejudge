const mongoose = require('mongoose');
const Problem = require('./Database/problems');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function insertProblems() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    const seedFilePath = './Database/problems_seed.json';
    if (!require('fs').existsSync(seedFilePath)) {
      console.error(`Seed file not found at ${seedFilePath}. Please run node parseProblems.js first.`);
      return;
    }

    const problemsData = require(seedFilePath);
    console.log(`Loaded ${problemsData.length} problems from seed file.`);

    // Optional: Clear existing non-contest problems to start fresh
    // await Problem.deleteMany({ contestOnly: false });
    // console.log('Cleared existing public problems.');

    console.log('Inserting problems into the database...');
    const result = await Problem.insertMany(problemsData);
    console.log(`Successfully inserted ${result.length} problems!`);

    // Let's create prerequisites connections between the inserted problems to build the Skill Tree (DAG) automatically!
    console.log('Building visual layout and parent-child dependencies...');
    const insertedProblems = await Problem.find({ contestOnly: false });
    
    // Reset all
    await Problem.updateMany({ contestOnly: false }, { $set: { prerequisites: [], coordinates: { x: 0, y: 0 } } });

    // Group by topic/difficulty to map dependencies logically
    const easyProbs = insertedProblems.filter(p => p.difficulty === 'Easy');
    const mediumProbs = insertedProblems.filter(p => p.difficulty === 'Medium');
    const hardProbs = insertedProblems.filter(p => p.difficulty === 'Hard');

    console.log(`Retrieved: ${easyProbs.length} Easy, ${mediumProbs.length} Medium, ${hardProbs.length} Hard problems.`);

    // Setup coordinates and links:
    // Root level (Easy problems)
    let currentX = 100;
    for (let i = 0; i < Math.min(easyProbs.length, 10); i++) {
      const p = easyProbs[i];
      p.coordinates = { x: currentX, y: 100 };
      p.prerequisites = [];
      await p.save();
      currentX += 280;
    }

    // Medium level (depends on corresponding Easy problems)
    let medX = 100;
    for (let i = 0; i < Math.min(mediumProbs.length, 15); i++) {
      const p = mediumProbs[i];
      p.coordinates = { x: medX, y: 300 };
      
      // Link to one or two Easy problems as prerequisites
      const preEasy1 = easyProbs[i % Math.min(easyProbs.length, 10)];
      const preEasy2 = easyProbs[(i + 1) % Math.min(easyProbs.length, 10)];
      p.prerequisites = [preEasy1._id, preEasy2._id];
      await p.save();
      medX += 280;
    }

    // Hard level (depends on corresponding Medium problems)
    let hardX = 150;
    for (let i = 0; i < Math.min(hardProbs.length, 10); i++) {
      const p = hardProbs[i];
      p.coordinates = { x: hardX, y: 500 };
      
      const preMed1 = mediumProbs[i % Math.min(mediumProbs.length, 15)];
      const preMed2 = mediumProbs[(i + 2) % Math.min(mediumProbs.length, 15)];
      p.prerequisites = [preMed1._id, preMed2._id];
      await p.save();
      hardX += 300;
    }

    console.log('Skill tree connections successfully populated!');
  } catch (error) {
    console.error('Error inserting problems:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

insertProblems();

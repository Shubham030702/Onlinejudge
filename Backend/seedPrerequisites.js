const mongoose = require('mongoose');
const Problem = require('./Database/problems');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function seedPrerequisites() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    const problems = await Problem.find({ contestOnly: false });
    console.log(`Found ${problems.length} public problems.`);

    if (problems.length < 3) {
      console.warn('Need at least 3 problems to build a meaningful DAG structure. Please create more problems first.');
      return;
    }

    // Set A (Problem 0) -> B (Problem 1) & C (Problem 2)
    const probA = problems[0];
    const probB = problems[1];
    const probC = problems[2];

    console.log(`Setting up DAG layout:`);
    console.log(`- Root Problem: "${probA.problemName}"`);
    console.log(`- Prereq for B: "${probB.problemName}"`);
    console.log(`- Prereq for C: "${probC.problemName}"`);

    // Reset all problems first
    await Problem.updateMany({}, { $set: { prerequisites: [], coordinates: { x: 0, y: 0 } } });

    // Update coordinates and prerequisites
    probA.coordinates = { x: 200, y: 100 };
    probA.prerequisites = [];
    await probA.save();

    probB.coordinates = { x: 50, y: 300 };
    probB.prerequisites = [probA._id];
    await probB.save();

    probC.coordinates = { x: 350, y: 300 };
    probC.prerequisites = [probA._id];
    await probC.save();

    // If there is a 4th problem, make it depend on both B and C
    if (problems.length >= 4) {
      const probD = problems[3];
      console.log(`- Dependent on B & C: "${probD.problemName}"`);
      probD.coordinates = { x: 200, y: 500 };
      probD.prerequisites = [probB._id, probC._id];
      await probD.save();
    }

    console.log('Prerequisites and coordinates successfully seeded!');
  } catch (error) {
    console.error('Error seeding prerequisites:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedPrerequisites();

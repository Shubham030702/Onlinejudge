const express = require('express');
const mongoose = require('mongoose');
const Problem = require('../Database/problems');
const User = require('../Database/user');
const CodeSubmission = require('../judge0');
const { isLoggedIn } = require('../middleware/authMiddleware');

const router = express.Router();
const submission = new CodeSubmission();

function base64code(code){
  const base64 = Buffer.from(code).toString('base64');
  return base64
}

router.get('/api/problems', isLoggedIn, async (req, res) => {
  try {
    const userdata = await User.findById(req.session.user.id);
    const attempted = userdata ? userdata.Submissions.map(item => item.Problem.toString()) : [];
    const solved = userdata
      ? userdata.Submissions.filter(item => item.Status === 'Accepted' || item.Status === 'accepted').map(item => item.Problem.toString())
      : [];

    const hasPaginationParams = req.query.limit !== undefined || req.query.cursor !== undefined;
    if (!hasPaginationParams) {
      const problems = await Problem.find({ contestOnly: false });
      if (!problems) {
        return res.status(404).json({ message: 'No problems found' });
      }
      return res.json({ problems, attempted, solved });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const { cursor, search, difficulty, topic, status } = req.query;

    const filter = { contestOnly: false };

    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      filter._id = { $gt: new mongoose.Types.ObjectId(cursor) };
    }

    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty;
    }

    if (topic && topic !== 'All') {
      filter.topics = topic;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ problemName: regex }, { topics: regex }];
    }

    if (status === 'Solved') {
      const attemptedObjectIds = attempted
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      filter._id = filter._id
        ? { ...filter._id, $in: attemptedObjectIds }
        : { $in: attemptedObjectIds };
    } else if (status === 'Unsolved') {
      const attemptedObjectIds = attempted
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      filter._id = filter._id
        ? { ...filter._id, $nin: attemptedObjectIds }
        : { $nin: attemptedObjectIds };
    }

    const items = await Problem.find(filter)
      .sort({ _id: 1 })
      .limit(limit + 1);

    const hasMore = items.length > limit;
    const problems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? problems[problems.length - 1]._id.toString() : null;

    let stats = null;
    let topicCounts = null;

    if (!cursor) {
      const allMeta = await Problem.find({ contestOnly: false }).select('_id difficulty topics').lean();
      const attemptedSet = new Set(attempted);
      const counts = {
        total: allMeta.length,
        solved: 0,
        Easy: { total: 0, solved: 0 },
        Medium: { total: 0, solved: 0 },
        Hard: { total: 0, solved: 0 }
      };
      const tMap = {};

      allMeta.forEach(p => {
        const isDone = attemptedSet.has(p._id.toString());
        if (isDone) counts.solved += 1;
        if (counts[p.difficulty]) {
          counts[p.difficulty].total += 1;
          if (isDone) counts[p.difficulty].solved += 1;
        }
        if (Array.isArray(p.topics)) {
          p.topics.forEach(t => {
            tMap[t] = (tMap[t] || 0) + 1;
          });
        }
      });

      stats = counts;
      topicCounts = Object.entries(tMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));
    }

    res.json({
      problems,
      attempted,
      solved,
      nextCursor,
      hasMore,
      stats,
      topicCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/api/problem/:id', isLoggedIn, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).populate('users');
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/api/submission', isLoggedIn, async(req,res)=>{
  const {id,Language,LanguageName,Code} = req.body.problemdesc
  console.log(req.body.problemdesc)
  const problem = await Problem.findById({_id:id});
  const userdata = await User.findById(req.session.user.id);
  if (!problem || !userdata) {
    return res.status(404).json({ error: "Problem, contest, or user not found." });
  }

  // Prerequisites check
  if (problem.prerequisites && problem.prerequisites.length > 0) {
    const solvedProblemIds = userdata.Submissions
      .filter(sub => sub.Status === 'Accepted')
      .map(sub => sub.Problem.toString());

    const unmetPrerequisites = problem.prerequisites.filter(
      prereqId => !solvedProblemIds.includes(prereqId.toString())
    );

    if (unmetPrerequisites.length > 0) {
      return res.status(403).json({
        error: "Prerequisites not met",
        message: "You must solve all prerequisite problems before attempting this one.",
        unmet: unmetPrerequisites
      });
    }
  }
  const inputs = []
  const outputs = []
  problem.testCases.forEach(e=>{
    inputs.push(e.input)
    outputs.push(e.output)
  })
  const boilerplate = problem.boilerplateFull[LanguageName];
  const FullCode = boilerplate.replace("## Enter Code Here ##",Code)
  const code64 = base64code(FullCode)
  async function evaluateSubmissions() {
    let Time=0;
    for (const [index, input] of inputs.entries()) {
      const output = outputs[index];
      const code64inp = base64code(input);
      const code64out = base64code(output);
      try {
        const result = await submission.evaluation(code64inp,Language,code64out, code64);
        const decode = Buffer.from(result.stdout,'base64').toString('utf-8');
        let d = parseFloat(result.time);
        Time+=d;
        if(result.status.id > 3){
          return {result,output,input,decode}
        }
      } catch (error) {        
        console.log(error);
        return {status:"Runtime Error",time:Time};
      } 
    }
    return {status:"Accepted",time:Time};
  }
  try {
    const result = await evaluateSubmissions();
    if(result.status === "Accepted"){
      userdata.Submissions.push({
        Problem:problem._id,
        Status:result.result?result.result.status.description:result.status,
        Solution:Code
      })
      await userdata.save()
      problem.users.push({
        user: req.session.user.id,
        Username: userdata.Username,
        Status:result.result?result.result.status.description:result.status,
        Solution:Code
      })
      await problem.save()
    }
    res.send(result);
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: "An error occurred while evaluating submissions." });
  }
})

router.post('/api/runprob', async(req,res)=>{
  const {id,Language,LanguageName,Code} = req.body.problemdesc
  const problem = await Problem.findOne({_id:id});
  const inputs = []
  const outputs = []
  problem.testCases.splice(0,2).forEach(e=>{
    inputs.push(e.input)
    outputs.push(e.output)
  })
  const boilerplate = problem.boilerplateFull[LanguageName];
  const FullCode = boilerplate.replace("## Enter Code Here ##",Code)
  const code64 = base64code(FullCode)
  async function evaluateSubmissions() {
    let Time=0;
    for (const [index, input] of inputs.entries()) {
      const output = outputs[index];
      const code64inp = base64code(input);
      const code64out = base64code(output);
      try {
        const result = await submission.evaluation(code64inp,Language, code64out, code64);
        const decode = Buffer.from(result.stdout,'base64').toString('utf-8');
        let d = parseFloat(result.time);
        Time+=d;
        if(result.status.id > 3){
          return {result,output,input,decode}
        }
      } catch (error) {
        return {status:"Runtime Error",time:Time};
      }
    }
    return {status:"Accepted",time:Time};
  }
  try {
    const result = await evaluateSubmissions();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "An error occurred while evaluating submissions." });
  }
})

module.exports = router;

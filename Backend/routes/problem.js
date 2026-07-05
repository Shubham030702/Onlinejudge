const express = require('express');
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
    const problems = await Problem.find({contestOnly : false});
    const userdata = await User.findById(req.session.user.id);
    const attempted = userdata ? userdata.Submissions.map(item=>item.Problem.toString()) : [];
    const solved = userdata ? userdata.Submissions.filter(item=>item.Status === 'Accepted' || item.Status === 'accepted').map(item=>item.Problem.toString()) : [];
    if (!problems) {
      return res.status(404).json({ message: "No problems found" });
    }
    res.json({problems,attempted,solved});
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

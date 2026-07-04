const express = require('express');
const Contest = require('../Database/contest');
const User = require('../Database/user');
const contestRegister = require('../redisCode');
const { isLoggedIn } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/api/contest', isLoggedIn, async (req, res) => {
  try {
    const contest = await Contest.find();
    res.json(contest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/api/contest/:id', isLoggedIn, async(req,res)=>{
  try{
    const contestId = req.params.id;
    const contest = await Contest.findById(contestId.toString()).populate('problems')
    const userId = req.session.user.id.toString();
    const exists = await contestRegister.ChkUser(contestId.toString(),userId);
    res.send({contest:contest,exists})
  }catch(err){
    res.send(err);
  }
})

router.post('/contest/register', async(req,res)=>{
  const {contestId} = req.body
  const userId = req.session.user
  const user = await User.findById(userId.id);
  const result = await contestRegister.Addredis(contestId.toString(),user._id.toString(),user.Username,user.Email)
  res.send(result)
})

router.post('/contest/IncrzScore', async(req,res)=>{
  const {contestId,userId,score} = req.body
  const result = await contestRegister.IncrzScore(contestId,userId,score)
  res.send({score:result.newScore})
})

router.post('/contest/IncrzPenalty', async(req,res)=>{
  const {contestId,userId,penalty} = req.body
  const result = await contestRegister.IncrzPenalty(contestId,userId,penalty)
  res.send({penaltyAdded:result.penaltyAdded})
})

router.get('/contest/GetLeaderBoard', async(req,res)=>{
  const {contestId} = req.body
  const result = await contestRegister.getLeaderboard(contestId,10)
  console.log(result);
  res.send(result)
})

module.exports = router;

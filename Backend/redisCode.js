const client = require('./redisConnection.js');

const contestKey = (contestId) => `contest:${contestId}`;
const hashKey = (contestId,userId) => `${contestKey(contestId)}:user:${userId}`;
const setKey = (contestId) => `${contestKey(contestId)}:users`;
const leaderKey = (contestId) => `${contestKey(contestId)}:leaderboard`;

const Addredis = async(contestId,userId,username,email)=>{
    try{
        await client.hSet(hashKey(contestId,userId),{
            userId,
            username,
            email,
            score:0,
            penalty:0
        })
        await client.sAdd(setKey(contestId),userId);
        await client.zAdd(leaderKey(contestId),[{score:0,value:userId}]);
        return {message:"User is successfully added."};
    }catch(err){
        console.log(err);
    }
}

const ChkUser = async(contestId,userId) =>{
    const exists = await client.sIsMember(setKey(contestId),userId);
    return exists===true;
}

const IncrzScore = async(contestId,userId,score)=>{
    const newScore = await client.zIncrBy(leaderKey(contestId),score,userId);
    await client.hIncrBy(hashKey(contestId,userId),"score",score)
    return {newScore}
}
const IncrzPenalty = async (contestId, userId, penalty=1) => {
    await client.hIncrBy(hashKey(contestId, userId), "penalty", penalty);
    return { penaltyAdded: penalty };
};

const getLeaderboard = async(contestId,top)=>{
    const raw = await client.zRangeWithScores(leaderKey(contestId),0,top-1,{REV:true});
    console.log(raw)
    const result = [];
    for(let i=0;i<raw.length;i++){
        const userId = raw[i].value;
        const scoreStr = raw[i].score;
        const score = Number(scoreStr);
        const user = await client.hGetAll(hashKey(contestId,userId));
        console.log(user)
        result.push({
            rank:result.length+1,
            username:user.username || null,
            score,
            penalty:user.penalty,
            userId
        });
    }
    return result;
}

module.exports = {Addredis,IncrzScore,getLeaderboard,IncrzPenalty,ChkUser};
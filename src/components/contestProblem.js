import React, { useState } from 'react'
import { useLocation , useNavigate } from 'react-router-dom'
import "./contestProblem.css"
import ContestTimer from "./ContestTimer.js"
import Loader from './loader'

function ContestProblem() {
  const API_URL = "http://localhost:5000"
  const location = useLocation();
  const navigate = useNavigate();
  const startTime = location.state.cont.starttime
  const endTime = location.state.cont.endtime
  const problems = location.state.cont.problems
  const [standings,setStandings] = useState([]);
  const [loading, setLoading] = useState(false);
  
  async function problemInter(id){
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/problem/${id}`,{
      method:'GET',  
      credentials:'include'
      }); 
      const response2 = await fetch(`${API_URL}/contest/GetLeaderBoard`,{
      method:'GET',  
      credentials:'include',
      body : JSON.stringify(location.state.cont._id)
      }); 
      setStandings(response2)
      console.log(response2);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (!response.ok) {
        if(response.status === 401) navigate('/');
        else throw new Error('Network response was not ok');
      }
      navigate(`/problemdesc/${id}`, { state: { problemData: data } });
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      {loading && <Loader messages={["Loading Problem Details...", "Fetching Leaderboard...", "Setting up compilers..."]} />}
      <ContestTimer 
        startTime={startTime}
        endTime={endTime} 
      />
    <div className="ContestProblemPage">
      <div className="leftContest">
       {problems.map(problem => (
          <li key={problem._id} onClick={()=>problemInter(problem._id)}>
            <div class="problems">
        <div class="problemtitle">
            <h1>{problem.problemName}</h1>
        </div>
        <div className="stat">
        <h3>Status</h3>
        </div>
    </div>
          </li>
        ))}
      </div>
      <div className="rightContest">
        <h1>🏆 Standings</h1>
        <ul>
          {standings.map((user, index) => (
            <li key={user._id || index}>
              <span className="rank">#{index + 1}</span>
              <span className="username">{user.username}</span>
              <span className="score">{user.score}</span>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </>
  )
}

export default ContestProblem

import React from 'react'
import { useLocation , useNavigate } from 'react-router-dom'
import "./contestProblem.css"

function ContestProblem() {
  const API_URL = "http://localhost:5000"
  const location = useLocation();
  const navigate = useNavigate();
  const contest = location.state.cont.standings
  const problems = location.state.cont.problems
  async function problemInter(id){
    try {
      const response = await fetch(`${API_URL}/api/problem/${id}`,{
      method:'GET',  
      credentials:'include'
      }); 
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
    }
  }
  return (
    <>
    <div className="timer">
    <h1 style={{"color":"White"}}>Contest time</h1>
    </div>
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
        <h1>Standings</h1>
        { 
        contest.map(e=>(
          <li key={e._id}>
            <h2>{e.user.Username}</h2>
            <h2>{e.user.Rating}</h2>
          </li>
        ))
        }
    </div>
      </div>
    </>
  )
}

export default ContestProblem

import React from 'react'
import { useLocation , useNavigate } from 'react-router-dom'
import "./home.css"

function ContestProblem() {
  const location = useLocation();
  const navigate = useNavigate();
  const problems = location.state.cont.problems
  async function problemInter(id){
    try {
      const response = await fetch(`http://localhost:5000/api/problem/${id}`,{
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
    <div className="home">
        {problems.map(problem => (
          <li key={problem._id} onClick={()=>problemInter(problem._id)}>
            <div class="card">
        <div class="title">
            <h1>{problem.problemName}</h1>
        </div>
    </div>
          </li>
        ))}
      </div>
    </>
  )
}

export default ContestProblem

import React from 'react'
import { useLocation,useNavigate } from 'react-router-dom'
import "./registerContest.css"

function RegisterContest() {
  const location = useLocation()
  const navigate = useNavigate()
  const contestDet = location.state.cont
  const id = location.state.cont._id
  const register = async(id) =>{
    try{
      const response = await fetch(`http://localhost:5000/api/contestRegistration/${id}`,{
        method : 'GET',
        credentials : "include"
      })  
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      navigate(`/contest/${id}`,{state:{cont : contestDet}}); 
    }catch(error){
      console.error(error)
    }
  }
  return (
    <>
    <div className="contest-container">
    <h1 className="contest-title">Contest Rules</h1>
    <ul className="contest-rules">
    <li style={{ color: "#fff7ba" }}>
  Only Register If You are sure to Participate. Otherwise, it can affect the rating.
</li>
        <li>1. Each participant must submit their own code.</li>
        <li>2. Plagiarism will result in disqualification.</li>
        <li>3. The contest duration is 1 hours.</li>
        <li>4. Only solutions submitted within the contest time will be considered.</li>
        <li>5. Each problem has a different score based on difficulty.</li>
        <li>6. The leaderboard will be updated in real-time.</li>
        <li>7. You cannot change your code once submitted.</li>
        <li>8. The final decision of the organizers is binding.</li>
    </ul>
    <button className="register-btn" onClick={()=>register(id)}>Register</button>
</div>

    </>
  )
}

export default RegisterContest

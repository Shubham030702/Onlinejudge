import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './contestUpdate.css';

function ContestUpdate() {
  const navigate = useNavigate();
  const location = useLocation();
  const problems = location.state.cont.problems
  const problemroute = async(id) =>{
    try {
      const response = await fetch(`https://onlinejudge-1-y4g1.onrender.com/api/problem/${id}`,{
      method:'GET',  
      credentials:'include'
      }); 
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (!response.ok) {
        if(response.status === 401) navigate('/home');
        else throw new Error('Network response was not ok');
      }
      navigate(`/problems/${id}`, { state: { problemData: data } });
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  }
  if(location.state.status === "Upcoming"){
    const utcTime = new Date(location.state.cont.starttime);
    const istTime = utcTime.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
    });
    return(
      <div className="contest-update-container">
          <div className="contest-card" style={{
    height: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color : 'white',
    flexDirection : 'column'
  }}>
            <h1 style={{margin:'2vh'}}>The contest has not been started Yet wait until {istTime}</h1>
            <button className='Backbutton' onClick={()=>navigate(-1)}>Back</button>
        </div>
      </div>
    )
  }
  else if(location.state.status === "Ended"){
    return (
      <div className="contest-update-container">
        <div className="contest-card">
          <h1 className="contest-title">Contest has been Ended.</h1>
          <ul>
          {problems.map((prob,index)=>{
              return (
                  <li key={index}>
                    <div className="problemlist" onClick={()=>problemroute(prob._id)}>
                      <h2>{prob.problemName}</h2>
                    </div>
                  </li>
                );
          })}
          </ul>
        </div>
      <div className="leftContest-card">
          <h1>Standings</h1>

      </div>
      </div>
    );
  }
} 

export default ContestUpdate;

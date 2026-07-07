import React,{useEffect,useState} from 'react';
import {useNavigate} from "react-router-dom"
import './contest.css'
import Loader from './loader'

const Contest = () => {
    const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://onlinejudge-2.onrender.com')
    const navigate = useNavigate();
    const [contest,setContest] = useState([]);
    const [Loading,setLoading] = useState(true);

    useEffect(()=>{
        const contestFetch = async() => {
           try{
            const response = await fetch(`${API_URL}/api/contest`,{
                method : 'GET',
                credentials : "include"
            })
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const result = await response.json();
            setContest(result);
            }catch(error){
                console.log(error.message);
            }finally{
                setLoading(false)
            }
        }
        contestFetch()
    },[])

    const contestroute = async(id)=>{
        setLoading(true);
        try{
            const response = await fetch(`${API_URL}/api/contest/${id}`,{
                method : 'GET',
                credentials : "include"
            })
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const result = await response.json();
            if(result.contest.status!=='Ended' && !result.exists){
                navigate(`/registerContest`,{state:{cont : result.contest}});    
            }
            else{
              if (result.contest?.status === 'Ended') {
                navigate('/contestUpdate', {
                  state: {
                    cont: result.contest,
                    status: "Ended"
                  }
                });
              } else if (result.contest?.status === 'Upcoming') {
                navigate('/contestUpdate', {
                  state: {
                    cont: result.contest,
                    status: "Upcoming"
                  }
                });
              }
             else {
                navigate(`/contest/${id}`, { state: { cont: result.contest } });
              }              
            }
            }catch(error){
                console.log(error.message);
            }finally{
                setLoading(false)
            }
        }

    if(Loading) return (
        <Loader messages={["Syncing Contests...", "Retrieving Leaderboard Status...", "Loading Arena..."]} />   
    )
    return(
    <> 
    <div className="home">
  {contest.map(cont => {
    const utcTime = new Date(cont.starttime);
    const istTime = utcTime.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
    });

    return (
      <li key={cont._id} onClick={() => contestroute(cont._id)}>
        <div className="card">
          <div className="title">
            <h1>Contest :- {cont.contestNo}</h1>
          </div>
          <div className="price">
            <h3>Starts at :</h3>
            <h3>{istTime}</h3>
          </div>
          <div className="action">
            <h2>{cont.status}</h2>
          </div>
        </div>
      </li>
    );
  })}
</div>
    </>
    )
}

export default Contest;
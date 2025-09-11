import React,{useEffect,useState} from 'react';
import {useNavigate} from "react-router-dom"
 
import './contest.css'
const Contest = () => {
    const navigate = useNavigate();
    const [contest,setContest] = useState([]);
    const [Loading,setLoading] = useState(true);

    useEffect(()=>{
        const contestFetch = async() => {
           try{
            const response = await fetch('http://localhost:5000/api/contest',{
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
        try{
            const response = await fetch(`http://localhost:5000/api/contest/${id}`,{
                method : 'GET',
                credentials : "include"
            })
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const result = await response.json();
            if(!result.userStanding){
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
        <>
        <div class="spin">⌛</div>
        </>    
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
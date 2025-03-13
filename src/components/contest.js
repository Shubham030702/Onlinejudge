import React,{useEffect,useState} from 'react';
import {useNavigate} from "react-router-dom"
 
import './contest.css'
const Contest = () => {
    const navigate = useNavigate();
    const [contest,setContest] = useState([]);
    const [Loading,setLoading] = useState(true);
    const [error,setError] = useState(true);
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
                setError(true);
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
                navigate(`/contest/${id}`,{state:{cont : result.contest}});    
            }
            }catch(error){
                setError(true);
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
        {contest.map(cont =>(
          <li key={cont._id} onClick={() => contestroute(cont._id)}>
            <div class="card">
            <div class="title">
                <h1>Contest :- {cont.contestNo}</h1>
            </div>
            <div class="price">
                <h2>{cont.starttime}</h2>
            </div>
            <div class="action">
                <h2>{cont.status}</h2>
            </div>
            </div>
         </li>
        ))}
      </div>
    </>
    )
}

export default Contest;
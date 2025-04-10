import React from 'react'
import { useEffect,useState } from 'react'
import "./Leaderboard.css"

function Leaderboard() {
    const [users,setusers] = useState([])
    const [currentInd,setcurrentInd] = useState()
    useEffect(() => {
        const extractUser = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/leaderboard', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setusers(data.response);
                    setcurrentInd(data.rank)
                } else {
                    console.error("Failed to fetch userData:", response.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
        };
        extractUser();
    }, []);
  return (
    <>
    <div className="rankings">
    <h1>LeaderBoard</h1>
    <ul>
    {users.map((user, index) => (
            <li key={user._id} className={user._id === currentInd ? "highlight" : ""}>
              <h2>{index + 1}</h2>
              <h2>{user.Username}</h2>
              <h2>{user.Rating}</h2>
            </li>
          ))}

    </ul>
</div>

    </>
  )
}

export default Leaderboard

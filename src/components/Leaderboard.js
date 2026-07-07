import React from 'react'
import { useEffect,useState } from 'react'
import "./Leaderboard.css"
import Loader from './loader'

function Leaderboard() {
    const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://onlinejudge-2.onrender.com')
    const [users,setusers] = useState([])
    const [currentInd,setcurrentInd] = useState()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const extractUser = async () => {
            try {
                const response = await fetch(`${API_URL}/api/leaderboard`, {
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
            } finally {
                setLoading(false);
            }
        };
        extractUser();
    }, []);

    if (loading) {
        return <Loader messages={["Retrieving rankings...", "Calibrating leaderboard...", "Calculating standings..."]} />;
    }
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

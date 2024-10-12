import React from 'react'
import './home.css'
import { useNavigate } from 'react-router-dom';
function Home() {
  const navigate = useNavigate();

  const handlequestionRoute=()=>{
    navigate('/')
  }

  return (
    <>
    <div className="home">
    <div className="smallnav">
      <li>All</li>
      <li>Array</li>
      <li>Binary Search</li>
      <li>Graph</li>
      <li>Dynamic Programming & Recursion</li>
      <li>Stack & queue</li>
    </div>
    <div class="card" onClick={handlequestionRoute}>
        <div class="best">
            <h1>Two Sum</h1>
        </div>
        <h2>Array</h2>
        <h3>Easy</h3>
    </div>
    </div>
    </>
  )
}

export default Home

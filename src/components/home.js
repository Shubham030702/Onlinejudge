import './home.css';
import React, { useEffect, useState } from 'react';

const ProblemList = () => {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/problems'); 
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data);
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    fetchProblems();
  }, []);

  return (
    <>
      <div className="home">
        {problems.map(problem => (
          <li key={problem._id}>
            <div class="card">
        <div class="title">
            <h1>{problem.problemName}</h1>
        </div>
        <div class="price">
            <h2>{problem.difficulty}</h2>
        </div>
        <div class="action">
            {problem.topics.map(t=>(<h4>{t}</h4>))}
        </div>
    </div>
          </li>
        ))}
      </div>
    </>
  );
};

export default ProblemList;

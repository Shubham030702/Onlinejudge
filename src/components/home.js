import './home.css';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

import { useNavigate } from 'react-router-dom';
const ProblemList = () => {
  const API_URL = "http://localhost:5000"
  const [problems, setProblems] = useState([]);
  const [attempted,setattempted] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch(`${API_URL}/api/problems`,{
          method : 'GET',
          credentials:'include',
        }); 
        if (!response.ok) {
          if(response.status === 401) {
            navigate('/')
        }
          else throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setProblems(data.problems || []);
        setattempted(data.attempted || []);
        console.log(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };
    fetchProblems();
  },[]);

  const problemroute = async(id) =>{
    try {
      const response = await fetch(`${API_URL}/api/problem/${id}`,{
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
      navigate(`/problems/${id}`, { state: { problemData: data } });
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  }

  return (
    <>
      <div className="home">
        {problems.map((problem) => {
          const isAttempted = attempted.includes(problem._id);
  
          return (
            <li key={problem._id}>
              <div className="card" onClick={() => problemroute(problem._id)}>
            
                <div className="title">
                  <h1>{problem.problemName}</h1>
                  <div className="action">
                    {problem.topics.map((t, index) => (
                      <h4 key={index}>{t}</h4>
                    ))}
                  </div>
                </div>
                <div className="price">
                  <h2
                    style={{
                      color:
                        problem.difficulty === "Easy"
                          ? "#00e676"
                          : problem.difficulty === "Medium"
                          ? "#ffcc00"
                          : "#ff4444",
                    }}
                  >
                    {problem.difficulty}
                  </h2>
                </div>
  
                <div className="status">
                {isAttempted && (
                  <FontAwesomeIcon icon={faCircleCheck} size="xl" style={{color: "#FFD43B",}} />
                )}
                </div>
              </div>
            </li>
          );
        })}
      </div>
    </>
  );
  
};

export default ProblemList;

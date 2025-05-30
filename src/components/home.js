import './home.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProblemList = () => {
  const [problems, setProblems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/problems',{
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
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    fetchProblems();
  }, []);

  const problemroute = async(id) =>{
    try {
      const response = await fetch(`http://localhost:5000/api/problem/${id}`,{
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
      {problems.map(problem => (
  <li key={problem._id} onClick={() => problemroute(problem._id)}>
    <div className="card">
      <div className="title">
        <h1>{problem.problemName}</h1>
      </div>
      <div className="price">
        <h2>{problem.difficulty}</h2>
      </div>
      <div className="action">
        {problem.topics.map((t, index) => (
          <h4 key={index}>{t}</h4>
        ))}
      </div>
    </div>
  </li>
))}

      </div>
    </>
  );
};

export default ProblemList;

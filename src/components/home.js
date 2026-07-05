import './home.css';
import React, { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import Loader from './loader';

import CustomDropdown from './CustomDropdown';

const ProblemList = () => {
  const API_URL = "http://localhost:5000"
  const [problems, setProblems] = useState([]);
  const [attempted, setattempted] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch(`${API_URL}/api/problems`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/')
          } else throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setProblems(data.problems || []);
        setattempted(data.attempted || []);
      } catch (error) {
        console.error('Error fetching problems:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, [navigate]);

  const problemroute = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/problem/${id}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) navigate('/');
        else throw new Error('Network response was not ok');
      }
      const data = await response.json();
      navigate(`/problems/${id}`, { state: { problemData: data } });
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  }

  // Extract unique topics
  const allTopics = useMemo(() => {
    const topics = new Set();
    problems.forEach(p => {
      if (p.topics) {
        p.topics.forEach(t => topics.add(t));
      }
    });
    return ["All", ...Array.from(topics)];
  }, [problems]);

  // Filter logic
  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      const matchesSearch = problem.problemName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "All" || problem.difficulty === difficultyFilter;
      const matchesTopic = topicFilter === "All" || (problem.topics && problem.topics.includes(topicFilter));
      
      return matchesSearch && matchesDifficulty && matchesTopic;
    });
  }, [problems, searchQuery, difficultyFilter, topicFilter]);

  return (
    <>
      {loading && <Loader messages={["Fetching Problems...", "Syncing Code Repository...", "Preparing workspace..."]} />}
      <div className="home-wrapper">
      <div className="home">
        
        {/* Filters Section */}
        <div className="filter-bar">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} color="#a1a1aa" className="search-icon" />
            <input 
              type="text" 
              placeholder="Search problems..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-dropdowns">
            <FontAwesomeIcon icon={faFilter} color="#a1a1aa" className="filter-icon" />
            
            <CustomDropdown 
              options={[
                { value: "All", label: "All Difficulties" },
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" }
              ]}
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              placeholder="All Difficulties"
            />

            <CustomDropdown 
              options={allTopics.map(t => ({ value: t, label: t === "All" ? "All Topics" : t }))}
              value={topicFilter}
              onChange={setTopicFilter}
              placeholder="All Topics"
            />
            
          </div>
        </div>

        {/* Problems List */}
        <div className="problems-list">
          {filteredProblems.map((problem) => {
            const isAttempted = attempted.includes(problem._id);

            return (
              <li key={problem._id}>
                <div className="card" onClick={() => problemroute(problem._id)}>
                  <div className="title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isAttempted && (
                        <FontAwesomeIcon icon={faCircleCheck} size="lg" style={{ color: "#FFD43B" }} />
                      )}
                      <h1>{problem.problemName}</h1>
                    </div>
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
                </div>
              </li>
            );
          })}
          
          {filteredProblems.length === 0 && (
            <div className="no-results">
              <h3>No problems found matching your criteria.</h3>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default ProblemList;

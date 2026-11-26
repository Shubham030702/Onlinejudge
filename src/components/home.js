import './home.css';
import React, { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faSearch,
  faShuffle,
  faChevronRight,
  faXmark,
  faCode
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import Loader from './loader';

import CustomDropdown from './CustomDropdown';

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://onlinejudge-2.onrender.com')

const ProblemList = () => {
  const [problems, setProblems] = useState([]);
  const [attempted, setattempted] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAllTopics, setShowAllTopics] = useState(false);

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

  // Extract unique topics with counts
  const topicCounts = useMemo(() => {
    const counts = {};
    problems.forEach(p => {
      if (p.topics) {
        p.topics.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [problems]);

  // Stats for LeetCode-style progress summary
  const stats = useMemo(() => {
    const counts = {
      total: problems.length,
      solved: 0,
      Easy: { total: 0, solved: 0 },
      Medium: { total: 0, solved: 0 },
      Hard: { total: 0, solved: 0 }
    };
    problems.forEach(p => {
      const isSolved = attempted.includes(p._id);
      if (isSolved) counts.solved += 1;
      if (counts[p.difficulty]) {
        counts[p.difficulty].total += 1;
        if (isSolved) counts[p.difficulty].solved += 1;
      }
    });
    return counts;
  }, [problems, attempted]);

  // Filter logic
  const filteredProblems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return problems.filter(problem => {
      const matchesSearch =
        !query ||
        problem.problemName.toLowerCase().includes(query) ||
        (problem.topics && problem.topics.some(t => t.toLowerCase().includes(query)));
      const matchesDifficulty = difficultyFilter === "All" || problem.difficulty === difficultyFilter;
      const matchesTopic = topicFilter === "All" || (problem.topics && problem.topics.includes(topicFilter));
      const isSolved = attempted.includes(problem._id);
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Solved" && isSolved) ||
        (statusFilter === "Unsolved" && !isSolved);

      return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
    });
  }, [problems, attempted, searchQuery, difficultyFilter, topicFilter, statusFilter]);

  const handlePickRandom = () => {
    const pool = filteredProblems.length > 0 ? filteredProblems : problems;
    if (pool.length === 0) return;
    const unsolvedPool = pool.filter(p => !attempted.includes(p._id));
    const targetPool = unsolvedPool.length > 0 ? unsolvedPool : pool;
    const randomProblem = targetPool[Math.floor(Math.random() * targetPool.length)];
    problemroute(randomProblem._id);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    difficultyFilter !== "All" ||
    topicFilter !== "All" ||
    statusFilter !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("All");
    setTopicFilter("All");
    setStatusFilter("All");
  };

  const visibleTopics = showAllTopics ? topicCounts : topicCounts.slice(0, 10);
  const solvedPercent = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

  return (
    <>
      {loading && <Loader messages={["Fetching Problems...", "Syncing Code Repository...", "Preparing workspace..."]} />}
      <div className="home-wrapper">
        <div className="home-container">

          {/* Hero & Progress Summary */}
          <div className="home-header">
            <div className="home-header-left">
              <div className="home-badge">
                <FontAwesomeIcon icon={faCode} />
                <span>Problemset</span>
              </div>
              <h1>Practice Coding Problems</h1>
              <p>Master data structures and algorithms with curated challenges.</p>
            </div>

            <div className="stats-card">
              <div className="stats-progress-row">
                <div className="stats-solved-text">
                  <span className="stats-solved-count">{stats.solved}</span>
                  <span className="stats-total-count">/ {stats.total} Solved</span>
                </div>
                <span className="stats-percent">{solvedPercent}%</span>
              </div>
              <div className="stats-progress-track">
                <div className="stats-progress-fill" style={{ width: `${solvedPercent}%` }} />
              </div>
              <div className="stats-difficulties">
                <div className="diff-stat easy">
                  <span className="diff-label">Easy</span>
                  <span className="diff-val">{stats.Easy.solved}/{stats.Easy.total}</span>
                </div>
                <div className="diff-stat medium">
                  <span className="diff-label">Med</span>
                  <span className="diff-val">{stats.Medium.solved}/{stats.Medium.total}</span>
                </div>
                <div className="diff-stat hard">
                  <span className="diff-label">Hard</span>
                  <span className="diff-val">{stats.Hard.solved}/{stats.Hard.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Chips Bar */}
          {topicCounts.length > 0 && (
            <div className="topics-strip">
              <button
                type="button"
                className={`topic-chip ${topicFilter === "All" ? "active" : ""}`}
                onClick={() => setTopicFilter("All")}
              >
                <span>All Topics</span>
                <span className="topic-count">{problems.length}</span>
              </button>
              {visibleTopics.map(({ name, count }) => (
                <button
                  type="button"
                  key={name}
                  className={`topic-chip ${topicFilter === name ? "active" : ""}`}
                  onClick={() => setTopicFilter(topicFilter === name ? "All" : name)}
                >
                  <span>{name}</span>
                  <span className="topic-count">{count}</span>
                </button>
              ))}
              {topicCounts.length > 10 && (
                <button
                  type="button"
                  className="topic-expand-btn"
                  onClick={() => setShowAllTopics(!showAllTopics)}
                >
                  {showAllTopics ? "Show less" : `+${topicCounts.length - 10} more`}
                </button>
              )}
            </div>
          )}

          {/* Filter & Search Toolbar */}
          <div className="filter-bar">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search problems by title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>

            <div className="filter-controls">
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
                options={[
                  { value: "All", label: "All Status" },
                  { value: "Solved", label: "Solved" },
                  { value: "Unsolved", label: "Unsolved" }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
              />

              <button
                type="button"
                className="random-btn"
                onClick={handlePickRandom}
                disabled={problems.length === 0}
                title="Pick a random problem"
              >
                <FontAwesomeIcon icon={faShuffle} />
                <span>Pick One</span>
              </button>
            </div>
          </div>

          {/* Problems Table */}
          <div className="problems-table-card">
            <div className="problems-table-header">
              <div className="col-status">Status</div>
              <div className="col-index">#</div>
              <div className="col-title">Title</div>
              <div className="col-topics">Topics</div>
              <div className="col-difficulty">Difficulty</div>
              <div className="col-action">Action</div>
            </div>

            <div className="problems-table-body">
              {filteredProblems.map((problem, index) => {
                const isAttempted = attempted.includes(problem._id);
                const diffClass = problem.difficulty ? problem.difficulty.toLowerCase() : "easy";
                const topics = problem.topics || [];

                return (
                  <div
                    key={problem._id}
                    className={`problem-row ${index % 2 === 1 ? "alt" : ""}`}
                    onClick={() => problemroute(problem._id)}
                  >
                    <div className="col-status" title={isAttempted ? "Solved" : "Unsolved"}>
                      {isAttempted ? (
                        <FontAwesomeIcon icon={faCircleCheck} className="status-solved-icon" />
                      ) : (
                        <span className="status-unsolved-dot" />
                      )}
                    </div>

                    <div className="col-index">{index + 1}</div>

                    <div className="col-title">
                      <span className="problem-title-text">{problem.problemName}</span>
                    </div>

                    <div className="col-topics">
                      {topics.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className={`table-topic-pill ${topicFilter === t ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTopicFilter(topicFilter === t ? "All" : t);
                          }}
                        >
                          {t}
                        </span>
                      ))}
                      {topics.length > 3 && (
                        <span className="table-topic-more">+{topics.length - 3}</span>
                      )}
                    </div>

                    <div className="col-difficulty">
                      <span className={`difficulty-badge ${diffClass}`}>
                        {problem.difficulty}
                      </span>
                    </div>

                    <div className="col-action">
                      <span className="solve-action-btn">
                        <span>{isAttempted ? "Review" : "Solve"}</span>
                        <FontAwesomeIcon icon={faChevronRight} />
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredProblems.length === 0 && (
                <div className="no-results">
                  <p>No problems found matching your current filters.</p>
                  {hasActiveFilters && (
                    <button type="button" className="reset-filters-btn" onClick={clearFilters}>
                      Reset all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ProblemList;

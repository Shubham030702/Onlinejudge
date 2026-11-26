import './home.css';
import React, { useEffect, useState, useRef, useCallback } from 'react';
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

const PAGE_SIZE = 20;

const ProblemList = () => {
  const [problems, setProblems] = useState([]);
  const [attempted, setattempted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    solved: 0,
    Easy: { total: 0, solved: 0 },
    Medium: { total: 0, solved: 0 },
    Hard: { total: 0, solved: 0 }
  });
  const [topicCounts, setTopicCounts] = useState([]);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAllTopics, setShowAllTopics] = useState(false);

  const loadMoreRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProblemsPage = useCallback(async (cursorVal = null, isAppend = false) => {
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        difficulty: difficultyFilter,
        topic: topicFilter,
        status: statusFilter
      });
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      if (cursorVal) {
        params.set('cursor', cursorVal);
      }

      const response = await fetch(`${API_URL}/api/problems?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/');
          return;
        }
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setProblems(prev => (isAppend ? [...prev, ...(data.problems || [])] : (data.problems || [])));
      setattempted(data.attempted || []);
      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
      if (data.stats) setStats(data.stats);
      if (data.topicCounts) setTopicCounts(data.topicCounts);
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      if (isAppend) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [debouncedSearch, difficultyFilter, topicFilter, statusFilter, navigate]);

  useEffect(() => {
    fetchProblemsPage(null, false);
  }, [fetchProblemsPage]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && nextCursor) {
          fetchProblemsPage(nextCursor, true);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, nextCursor, fetchProblemsPage]);

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

  const handlePickRandom = () => {
    if (problems.length === 0) return;
    const unsolvedPool = problems.filter(p => !attempted.includes(p._id));
    const targetPool = unsolvedPool.length > 0 ? unsolvedPool : problems;
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
                <span className="topic-count">{stats.total}</span>
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
              {problems.map((problem, index) => {
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

              {problems.length === 0 && !loading && (
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

          <div ref={loadMoreRef} className="pagination-sentinel">
            {loadingMore && (
              <div className="loading-more">
                <span className="loading-more-spinner" />
                <span>Loading next 20 problems...</span>
              </div>
            )}
            {!loading && !loadingMore && !hasMore && problems.length > 0 && (
              <div className="end-of-list">
                Showing {problems.length} problems
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default ProblemList;

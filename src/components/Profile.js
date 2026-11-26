import React, { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faCheckCircle,
  faCode,
  faTrophy,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import './Profile.css';
import { formatTimestamp } from './utils';
import Loader from './loader';

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://onlinejudge-2.onrender.com');

function Profile() {
  const [userData, setUserData] = useState(null);
  const [probData, setprobData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userPromise = fetch(`${API_URL}/profile`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(res => (res.ok ? res.json() : null));

        const probPromise = fetch(`${API_URL}/api/problems`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(res => (res.ok ? res.json() : null));

        const [userResult, probResult] = await Promise.all([userPromise, probPromise]);
        if (userResult) setUserData(userResult);
        if (probResult) setprobData(probResult.problems);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, []);

  const stats = useMemo(() => {
    if (!userData || !probData) {
      return { totalSolved: 0, totalProblems: 0, acceptanceRate: 0, Easy: 0, Medium: 0, Hard: 0 };
    }
    const solvedIds = new Set(
      (userData.Submissions || [])
        .filter(s => s.Status === 'Accepted')
        .map(s => s.Problem)
    );
    const totalSubs = (userData.Submissions || []).length;
    const acceptedSubs = (userData.Submissions || []).filter(s => s.Status === 'Accepted').length;
    const acceptanceRate = totalSubs > 0 ? Math.round((acceptedSubs / totalSubs) * 100) : 0;

    let Easy = 0, Medium = 0, Hard = 0;
    probData.forEach(p => {
      if (solvedIds.has(p._id)) {
        if (p.difficulty === 'Easy') Easy += 1;
        else if (p.difficulty === 'Medium') Medium += 1;
        else if (p.difficulty === 'Hard') Hard += 1;
      }
    });

    return {
      totalSolved: solvedIds.size,
      totalProblems: probData.length,
      acceptanceRate,
      Easy,
      Medium,
      Hard
    };
  }, [userData, probData]);

  return (
    <>
      {loading && <Loader messages={['Fetching User Profile...', 'Compiling submissions...', 'Generating coder stats...']} />}
      <div className="profile-wrapper">
        <div className="profile-container">
          <div className="leftProfile">
            <div className="user-card">
              <div className="usercontent" />
              {userData ? (
                <div className="user-info">
                  <div className="profile-badge">
                    <FontAwesomeIcon icon={faUser} />
                    <span>Coder Profile</span>
                  </div>
                  <h1 className="username">{userData.Username}</h1>
                  <p className="email">{userData.Email}</p>

                  <div className="stats-container">
                    <div className="stat-box">
                      <FontAwesomeIcon icon={faTrophy} className="stat-icon rating" />
                      <span className="stat-value rating">{userData.Rating}</span>
                      <span className="stat-label">Rating</span>
                    </div>
                    <div className="stat-box">
                      <FontAwesomeIcon icon={faCheckCircle} className="stat-icon solved" />
                      <span className="stat-value">{stats.totalSolved}</span>
                      <span className="stat-label">Solved</span>
                    </div>
                    <div className="stat-box">
                      <FontAwesomeIcon icon={faCode} className="stat-icon subs" />
                      <span className="stat-value">{stats.acceptanceRate}%</span>
                      <span className="stat-label">Acceptance</span>
                    </div>
                  </div>

                  <div className="difficulty-breakdown">
                    <div className="diff-pill easy">
                      <span>Easy</span>
                      <strong>{stats.Easy}</strong>
                    </div>
                    <div className="diff-pill medium">
                      <span>Medium</span>
                      <strong>{stats.Medium}</strong>
                    </div>
                    <div className="diff-pill hard">
                      <span>Hard</span>
                      <strong>{stats.Hard}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="loading-user">Loading profile...</div>
              )}
            </div>
          </div>

          <div className="rightProfile">
            <div className="listsubmission">
              <div className="submission-header">
                <div>
                  <h1>Recent Submissions</h1>
                  <p>{userData ? `${userData.Submissions.length} total submissions` : 'Loading history...'}</p>
                </div>
              </div>

              <div className="submission-table-header">
                <div>Problem</div>
                <div>Status</div>
                <div className="text-right">Submitted</div>
              </div>

              {probData && userData ? (
                <div className="submission-list">
                  {userData.Submissions.length > 0 ? (
                    userData.Submissions.map((submission, index) => {
                      const problem = probData.find(p => p._id === submission.Problem);
                      const isAccepted = submission.Status === 'Accepted';
                      return (
                        <div className={`listitem ${index % 2 === 1 ? 'alt' : ''}`} key={index}>
                          <div className="prob-name-cell">
                            <span className="prob-name">{problem ? problem.problemName : 'Problem not found'}</span>
                          </div>
                          <div>
                            <span className={`status-badge ${isAccepted ? 'accepted' : 'rejected'}`}>
                              {submission.Status}
                            </span>
                          </div>
                          <div className="timestamp">
                            <FontAwesomeIcon icon={faClock} />
                            <span>{formatTimestamp(submission.Time)}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-submissions">No submissions yet. Start coding!</div>
                  )}
                </div>
              ) : (
                <div className="loading-user">Loading submissions...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;

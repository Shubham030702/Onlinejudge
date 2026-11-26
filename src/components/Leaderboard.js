import React, { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRankingStar, faCrown, faSearch } from '@fortawesome/free-solid-svg-icons';
import './Leaderboard.css';
import Loader from './loader';

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://onlinejudge-2.onrender.com');

const getTier = (rating) => {
  if (rating >= 2000) return { label: 'Grandmaster', cls: 'gm' };
  if (rating >= 1600) return { label: 'Expert', cls: 'expert' };
  if (rating >= 1200) return { label: 'Specialist', cls: 'specialist' };
  return { label: 'Coder', cls: 'coder' };
};

function Leaderboard() {
  const [users, setusers] = useState([]);
  const [currentInd, setcurrentInd] = useState();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
          setusers(data.response || []);
          setcurrentInd(data.rank);
        } else {
          console.error('Failed to fetch userData:', response.status);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    extractUser();
  }, []);

  const rankedUsers = useMemo(() => {
    return users.map((u, idx) => ({ ...u, rank: idx + 1 }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rankedUsers;
    return rankedUsers.filter(u => (u.Username || '').toLowerCase().includes(q));
  }, [rankedUsers, searchQuery]);

  if (loading) {
    return <Loader messages={['Retrieving rankings...', 'Calibrating leaderboard...', 'Calculating standings...']} />;
  }

  return (
    <div className="lb-wrapper">
      <div className="lb-container">
        <div className="lb-header">
          <div>
            <div className="lb-badge">
              <FontAwesomeIcon icon={faRankingStar} />
              <span>Standings</span>
            </div>
            <h1>Global Leaderboard</h1>
            <p>Top competitive programmers ranked by contest rating.</p>
          </div>

          <div className="lb-search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Find coder by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Top 3 Podium */}
        {!searchQuery && rankedUsers.length >= 3 && (
          <div className="lb-podium">
            {[rankedUsers[1], rankedUsers[0], rankedUsers[2]].map((user) => {
              const medalClass = user.rank === 1 ? 'gold' : user.rank === 2 ? 'silver' : 'bronze';
              return (
                <div key={user._id} className={`podium-card ${medalClass} ${user._id === currentInd ? 'is-me' : ''}`}>
                  <div className="podium-rank">
                    <FontAwesomeIcon icon={faCrown} />
                    <span>#{user.rank}</span>
                  </div>
                  <div className="podium-name">{user.Username}</div>
                  <div className="podium-rating">{user.Rating} <span>pts</span></div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rankings Table */}
        <div className="lb-table-card">
          <div className="lb-table-header">
            <div>Rank</div>
            <div>Coder</div>
            <div>Tier</div>
            <div className="text-right">Rating</div>
          </div>

          {filteredUsers.map((user, idx) => {
            const isCurrentUser = user._id === currentInd;
            const tier = getTier(user.Rating);

            return (
              <div
                key={user._id}
                className={`lb-row ${idx % 2 === 1 ? 'alt' : ''} ${isCurrentUser ? 'highlight' : ''}`}
              >
                <div className="lb-rank-cell">
                  <span className={`rank-num rank-${user.rank <= 3 ? user.rank : 'other'}`}>
                    #{user.rank}
                  </span>
                </div>

                <div className="lb-user-cell">
                  <span className="lb-avatar">{(user.Username || '?')[0].toUpperCase()}</span>
                  <span className="lb-username">{user.Username}</span>
                  {isCurrentUser && <span className="you-pill">You</span>}
                </div>

                <div>
                  <span className={`tier-badge ${tier.cls}`}>{tier.label}</span>
                </div>

                <div className="lb-rating-cell">{user.Rating}</div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="lb-empty">No coders found matching "{searchQuery}".</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;

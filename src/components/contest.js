import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faClock,
  faChevronRight,
  faCalendarDays
} from '@fortawesome/free-solid-svg-icons';
import './contest.css';
import Loader from './loader';

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://onlinejudge-2.onrender.com');

const Contest = () => {
  const navigate = useNavigate();
  const [contest, setContest] = useState([]);
  const [Loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const contestFetch = async () => {
      try {
        const response = await fetch(`${API_URL}/api/contest`, {
          method: 'GET',
          credentials: 'include'
        });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const result = await response.json();
        setContest(result || []);
      } catch (error) {
        console.log(error.message);
      } finally {
        setLoading(false);
      }
    };
    contestFetch();
  }, []);

  const contestroute = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/contest/${id}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      const result = await response.json();
      if (result.contest.status !== 'Ended' && !result.exists) {
        navigate(`/registerContest`, { state: { cont: result.contest } });
      } else {
        if (result.contest?.status === 'Ended') {
          navigate('/contestUpdate', {
            state: {
              cont: result.contest,
              status: 'Ended'
            }
          });
        } else if (result.contest?.status === 'Upcoming') {
          navigate('/contestUpdate', {
            state: {
              cont: result.contest,
              status: 'Upcoming'
            }
          });
        } else {
          navigate(`/contest/${id}`, { state: { cont: result.contest } });
        }
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const c = { All: contest.length, Live: 0, Upcoming: 0, Ended: 0 };
    contest.forEach(item => {
      if (item.status === 'Ongoing' || item.status === 'Live') c.Live += 1;
      else if (item.status === 'Upcoming') c.Upcoming += 1;
      else if (item.status === 'Ended') c.Ended += 1;
    });
    return c;
  }, [contest]);

  const filteredContests = useMemo(() => {
    if (statusFilter === 'All') return contest;
    if (statusFilter === 'Live') {
      return contest.filter(c => c.status === 'Ongoing' || c.status === 'Live');
    }
    return contest.filter(c => c.status === statusFilter);
  }, [contest, statusFilter]);

  if (Loading) {
    return (
      <Loader messages={['Syncing Contests...', 'Retrieving Leaderboard Status...', 'Loading Arena...']} />
    );
  }

  return (
    <div className="contest-wrapper">
      <div className="contest-container">
        <div className="contest-header">
          <div>
            <div className="contest-badge">
              <FontAwesomeIcon icon={faTrophy} />
              <span>Competitions</span>
            </div>
            <h1>Coding Contests</h1>
            <p>Compete in timed algorithmic rounds and climb the global rating leaderboard.</p>
          </div>

          <div className="contest-tabs">
            {['All', 'Live', 'Upcoming', 'Ended'].map(tab => (
              <button
                type="button"
                key={tab}
                className={`contest-tab ${statusFilter === tab ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab)}
              >
                <span>{tab}</span>
                <span className="contest-tab-count">{counts[tab] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="contest-table-card">
          <div className="contest-table-header">
            <div>Contest</div>
            <div>Schedule (IST)</div>
            <div>Status</div>
            <div className="text-right">Action</div>
          </div>

          {filteredContests.length > 0 ? (
            filteredContests.map((cont, idx) => {
              const utcTime = new Date(cont.starttime);
              const istTime = utcTime.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
                hour12: true
              });
              const statusKey = (cont.status || '').toLowerCase();
              const isLive = statusKey === 'ongoing' || statusKey === 'live';

              return (
                <div
                  key={cont._id}
                  className={`contest-row ${idx % 2 === 1 ? 'alt' : ''}`}
                  onClick={() => contestroute(cont._id)}
                >
                  <div className="contest-name-cell">
                    <div className="contest-icon-box">
                      <FontAwesomeIcon icon={faTrophy} />
                    </div>
                    <div>
                      <div className="contest-title">AceCode Contest #{cont.contestNo}</div>
                      <div className="contest-subtitle">Rated Algorithmic Round</div>
                    </div>
                  </div>

                  <div className="contest-time-cell">
                    <FontAwesomeIcon icon={faCalendarDays} />
                    <span>{istTime}</span>
                  </div>

                  <div>
                    <span className={`contest-status-pill ${isLive ? 'live' : statusKey}`}>
                      {isLive && <span className="live-dot" />}
                      {cont.status}
                    </span>
                  </div>

                  <div className="contest-action-cell">
                    <span className="contest-action-btn">
                      <span>{cont.status === 'Ended' ? 'Standings' : 'Enter'}</span>
                      <FontAwesomeIcon icon={faChevronRight} />
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="contest-empty">
              <FontAwesomeIcon icon={faClock} />
              <p>No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} contests available right now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contest;

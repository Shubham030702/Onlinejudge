import React, { useEffect, useState } from 'react';
import './Profile.css';
import {formatTimestamp} from './utils'
import Loader from './loader';

function Profile() {
    const [userData, setUserData] = useState(null);
    const [probData, setprobData] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_URL = "http://localhost:5000"
    
    useEffect(() => {
        const loadProfileData = async () => {
            try {
                const userPromise = fetch(`${API_URL}/profile`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(res => res.ok ? res.json() : null);

                const probPromise = fetch(`${API_URL}/api/problems`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(res => res.ok ? res.json() : null);

                const [userResult, probResult] = await Promise.all([userPromise, probPromise]);
                if (userResult) setUserData(userResult);
                if (probResult) setprobData(probResult.problems);
            } catch (error) {
                console.error("Error loading profile data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadProfileData();
    }, []);

    return (
        <>
            {loading && <Loader messages={["Fetching User Profile...", "Compiling submissions...", "Generating coder stats..."]} />}
            <div className="profile-wrapper">
            <div className="profile-container">
                <div className="leftProfile">
                    <div className="user-card">
                        <div className="usercontent"></div>
                        {userData ? (
                            <div className="user-info">
                                <h1 className="username">{userData.Username}</h1>
                                <p className="email">{userData.Email}</p>
                                
                                <div className="stats-container">
                                    <div className="stat-box">
                                        <span className="stat-value">{userData.Submissions.length}</span>
                                        <span className="stat-label">Submissions</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-value rating">{userData.Rating}</span>
                                        <span className="stat-label">Rating</span>
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
                            <h1>Recent Submissions</h1>
                        </div>
                        {probData && userData ? (
                            <div className="submission-list">
                                {userData.Submissions.length > 0 ? (
                                    userData.Submissions.map((submission, index) => {
                                        const problem = probData.find(p => p._id === submission.Problem);
                                        return (
                                            <div className='listitem' key={index}>
                                                <h3 className="prob-name">{problem ? problem.problemName : "Problem not found"}</h3>
                                                <span className={`status-badge ${submission.Status === 'Accepted' ? 'accepted' : 'rejected'}`}>
                                                    {submission.Status}
                                                </span>
                                                <span className="timestamp">{formatTimestamp(submission.Time)}</span>
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

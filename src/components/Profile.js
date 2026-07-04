import React, { useEffect, useState } from 'react';
import './Profile.css';
import {formatTimestamp} from './utils'

function Profile() {
    const [userData, setUserData] = useState(null);
    const [probData, setprobData] = useState(null);
    const API_URL = "http://localhost:5000"
    
    useEffect(() => {
        const extractUser = async () => {
            try {
                const response = await fetch(`${API_URL}/profile`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data); 
                } else {
                    console.error("Failed to fetch userData:", response.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
        };

        extractUser();
    }, []);

    useEffect(() => {
        const extractProb = async () => {
            try {
                const response = await fetch(`${API_URL}/api/problems`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setprobData(data.problems); 
                } else {
                    console.error("Failed to fetch probData:", response.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
        };

        extractProb();
    }, []);

    return (
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
    );
}

export default Profile;

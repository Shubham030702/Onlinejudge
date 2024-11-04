import React, { useEffect, useState } from 'react';
import './Profile.css';
import {formatTimestamp} from './utils'
function Profile() {
    const [userData, setUserData] = useState(null);
    const [probData, setprobData] = useState(null);

    useEffect(() => {
        const extractUser = async () => {
            try {
                const response = await fetch('http://localhost:5000/profile', {
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
                const response = await fetch('http://localhost:5000/api/problems', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setprobData(data); 
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
        <>
            <div className="container">
                <div className="leftProfile">
                    <div className="usercontent">
                        
                    </div>
                    {userData && (
                            <>
                                <h2>{userData.Username}</h2>
                                <h2>{userData.Email}</h2>
                                <h2>{userData.Submissions.length}</h2><h2>Submissions</h2>
                            </>
                        )}
                </div>
                <div className="rightProfile">
                    {probData && userData && (
                        <div className="listsubmission">
                            <ul>
                            {userData.Submissions.map((submission, index) => {
                                const problem = probData.find(p => p._id === submission.Problem);
                                return (
                                    <>
                                    <h1>Submissions</h1>
                                    <div className='listitem' key={index}>
                                        <h3>{problem ? problem.problemName : "Problem not found"}</h3>
                                        <h3>{submission.Status}</h3>
                                        <h3>{formatTimestamp(submission.Time)}</h3>
                                    </div>
                                    </>
                                );
                            })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Profile;

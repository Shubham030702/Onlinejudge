import React, { useEffect, useState } from 'react';
import './Profile.css';

function Profile() {
    const [userData, setUserData] = useState(null);

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

    console.log(userData);

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
                    {userData && (
                        <div className="listsubmission">
                            <ul>
                            {userData.Submissions.map((e, index) => (
                                <li key={index}>{e.Status}</li>
                            ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Profile;

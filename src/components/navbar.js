import React from 'react';
import './navbar.css';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

function Navbar() {
  const API_URL = "http://localhost:5000"
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    if (isLoggingOut) return; 
    setIsLoggingOut(true);
    try {
      const response = await fetch(`${API_URL}/api/logout`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        navigate('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/home" style={{ textDecoration: 'none' }}><h1 className='site'>AcECode</h1></Link>
        <div className="nav-links">
          <Link to="/home" className={isActive('/home') ? 'active-link' : ''}>Home</Link>
          <Link to="/contest" className={isActive('/contest') ? 'active-link' : ''}>Contest</Link>
          <Link to="/Leaderboard" className={isActive('/Leaderboard') ? 'active-link' : ''}>Leaderboard</Link>
        </div>
      </div>
      <div className="nav-right">
        <Link to="/profile" className="icon-btn">
          <FontAwesomeIcon icon={faUser} title="Profile" size="lg" />
        </Link>
        <button onClick={handleLogout} className="icon-btn">
          <FontAwesomeIcon title="Logout" size="lg" icon={faRightFromBracket} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

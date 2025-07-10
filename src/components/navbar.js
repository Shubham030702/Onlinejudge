import React from 'react';
import './navbar.css';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/logout', {
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
    }
  };

  return (
    <>
      <nav>
        <li>
          <h1 className='site'>AcECode</h1>
          <Link to="/home"><h2 className='hometag'>Home</h2></Link>
          <div className="hometag">|</div>
          <Link to="/contest"><h2 className='hometag'>Contest</h2></Link>
          <div className="hometag">|</div>
          <Link to="/Leaderboard"><h2 className='hometag'>Leaderboard</h2></Link>
          <div className="rightnav">
            <Link to="/profile">
              <FontAwesomeIcon className='logouttag' icon={faUser} title="Profile" size="xl" />
            </Link>
            <button onClick={handleLogout}>
              <FontAwesomeIcon className='logouttag' title="Logout" size="xl" icon={faRightFromBracket} />
            </button>
          </div>
        </li>
      </nav>
    </>
  );
}

export default Navbar;

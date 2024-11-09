import React from 'react'
import './navbar.css'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket , faUser} from '@fortawesome/free-solid-svg-icons';


function Navbar() {
  const navigate = useNavigate()
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
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
        <a href="/home"><h2 className='hometag' >Home</h2></a>
        <div className="rightnav">
        <a href="/profile"><FontAwesomeIcon className='logouttag' icon={faUser} title="Profile" size="xl"/></a>
        <button><FontAwesomeIcon className='logouttag' onClick={handleLogout} title="Logout" size="xl" icon={faRightFromBracket}/></button>
        </div>
      </li>
    </nav>
    </>
  )
}
export default Navbar

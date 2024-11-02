import React from 'react'
import './navbar.css'
import { useNavigate } from 'react-router-dom'
function Navbar() {
  const navigate = useNavigate()
  const handleLogout = async () => {
    console.log('shuabhm')
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
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
        <a href="/profile"><h2 className='profile'>Profile</h2></a>
        <a > <h2 className='logouttag'onClick={handleLogout}>Logout</h2></a>
        </div>
      </li>
    </nav>
    </>
  )
}

export default Navbar

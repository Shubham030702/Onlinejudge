import React from 'react'
import './navbar.css'
function Navbar() {
  return (
    <>
    <nav>
      <li>
        <h1 className='site'>AcECode</h1>
        <a href="/home"><h2 className='hometag' >Home</h2></a>
      </li>
    </nav>
    </>
  )
}

export default Navbar

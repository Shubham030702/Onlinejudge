import React, { useState } from 'react';
import './loginpage.css';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // Fixed variable name
  const [password, setPassword] = useState('');
  const [conPassword, setConPassword] = useState(''); // Fixed variable name
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleLoginRoute = () => {
    navigate('/Login');
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let isValid = true;
    let tempErrors = {};

    setErrors({});

    if (!validateEmail(email)) {
      tempErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (username.trim() === '') {
      tempErrors.username = "Username is required."; // Added check for username
      isValid = false;
    }

    if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters long.";
      isValid = false;
    }
    
    if (password !== conPassword) {
      tempErrors.conPassword = "Password doesn't match."; // Fixed error key
      isValid = false;
    }

    setErrors(tempErrors);

    if (isValid) {
      alert('Sign Up successful!');
      // Here, you can add logic to submit the form data
    }
  };

  return (
    <div className="login-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="email">Email</label>
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>
        <div className="input-group">
          <input
            type="text" // Changed to 'text'
            id="username" // Changed ID to be unique
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <label htmlFor="username">Username</label>
          {errors.username && <div className="error-message">{errors.username}</div>}
        </div>
        <div className="input-group">
          <input
            type="password"
            id="password" // Ensure unique ID
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          {errors.password && (
            <div className="error-message">{errors.password}</div> // Fixed error reference
          )}
        </div>
        <div className="input-group">
          <input
            type="password"
            id="conPassword" // Changed ID to be unique
            value={conPassword}
            onChange={(e) => setConPassword(e.target.value)}
            required
          />
          <label htmlFor="conPassword">Confirm Password</label>
          {errors.conPassword && (
            <div className="error-message">{errors.conPassword}</div> // Fixed error reference
          )}
        </div>
        <div className="actions">
          <button type="submit">Sign Up</button>
          <button type="button" onClick={handleLoginRoute}>Login</button> {/* Changed to type="button" */}
        </div>
      </form>
    </div>
  );
};

export default Register;

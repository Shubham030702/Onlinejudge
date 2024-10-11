import React, { useState } from 'react';
import './loginpage.css'
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();       
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleloginroute=()=>{
    navigate('/');
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let isValid = true;
    let tempErrors = {};

    setErrors({});

    if (!validateEmail(email)) {
      tempErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters long.";
      isValid = false;
    }

    setErrors(tempErrors);

    if (isValid) {
      alert('Login successful!');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
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
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          {errors.password && (
            <div className="error-message">{errors.password}</div>
          )}
        </div>
        <div className="actions">
          <button type="submit">Log In</button>
        <button type='submit' onClick={handleloginroute}>Sign up</button>
        </div>
      </form>
    </div>
  );
};

export default Login;

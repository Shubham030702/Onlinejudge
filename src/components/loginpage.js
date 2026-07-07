import React, { useState } from 'react';
import './loginpage.css'
import { useNavigate } from 'react-router-dom';
import Loader from './loader';

const Login = () => {
  const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://onlinejudge-2.onrender.com')
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();       
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleloginroute=()=>{
    navigate('/signup');
  }

  const handleSubmit = async(e) => {
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

    const credential= {
      Email :email,
      Password:password
    }

    setErrors(tempErrors);

    if (isValid) {
      setLoading(true);
      try{
        const response = await fetch(`${API_URL}/api/login`,{
          method:'POST',
          headers: {
            'Content-Type' : 'application/json',
          },
          body : JSON.stringify(credential),
          credentials:'include'
        })
        const data = await response.json()
        console.log(data)
        if(response.ok) {
          navigate('/home')
        }
        else {
          setErrors({notfound:data.message});
          console.log(data.message);
        }
      }catch(error){
        console.log(error);
      } finally {
        setLoading(false);
      }
  }
  };

  return (
    <>
      {loading && <Loader messages={["Logging in...", "Verifying Credentials...", "Accessing AceCode..."]} />}
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
          {errors.notfound && <div className="error-message">{errors.notfound}</div>}
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
        <button type='submit' onClick={handleloginroute}>New User! Sign up</button>
        </div>
      </form>
    </div>
    </>
  );
};

export default Login;

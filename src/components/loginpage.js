import React, { useState } from 'react';
import './loginpage.css';
import { useNavigate } from 'react-router-dom';
import Loader from './loader';

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://onlinejudge-2.onrender.com');

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(val).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let isValid = true;
    const tempErrors = {};
    setErrors({});

    if (!validateEmail(email)) {
      tempErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters long.';
      isValid = false;
    }

    setErrors(tempErrors);

    if (isValid) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ Email: email, Password: password }),
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          navigate('/home');
        } else {
          setErrors({ notfound: data.message });
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      {loading && <Loader messages={['Logging in...', 'Verifying Credentials...', 'Accessing AceCode...']} />}
      <div className="auth-wrapper">
        <div className="login-container">
          <div className="auth-brand">AcECode</div>
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to continue solving coding challenges.</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
              {errors.notfound && <div className="error-message">{errors.notfound}</div>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            <div className="actions">
              <button type="submit" className="auth-primary-btn">Log In</button>
            </div>
          </form>

          <div className="auth-footer">
            <span>New to AcECode?</span>
            <button type="button" className="auth-link-btn" onClick={() => navigate('/signup')}>
              Create an account
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;

import React, { useState } from 'react';
import './loginpage.css';
import { useNavigate } from 'react-router-dom';
import RegisterLoader from './RegisterLoader'

const Register = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [conPassword, setConPassword] = useState(''); 
  const [errors, setErrors] = useState({});
  const [steps,setSteps] = useState('manager');
  const [loading,setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLoginRoute = () => {
    navigate('/');
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    let isValid = true;
    let tempErrors = {};
    setLoading(true)
    setErrors({});

    if (!validateEmail(email)) {
      tempErrors.email = "Please enter a valid email address.";
      isValid = false;
    }
    if (username.trim() === '') {
      tempErrors.username = "Username is required."; 
      isValid = false;
    }
    if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters long.";
      isValid = false;
    }
    if (password !== conPassword) {
      tempErrors.conPassword = "Password doesn't match."; 
      isValid = false;
    }

    setErrors(tempErrors);

    const credentials={
      Email : email,
      Username : username,
      Password : password
    };

    if (isValid) {
      try{
        const response = await fetch('https://onlinejudge-1-y4g1.onrender.com/api/signup',{
          method: 'POST',
          headers: {
            'Content-Type' : 'application/json',
          },
          body : JSON.stringify(credentials)
        });
        const data = await response.json()
        if(response.ok) {
          alert('User Signed in Successfully...');
          navigate('/')
        }
        else alert(data.message)
      }catch(error){
        alert(error)
      }
    }
    setLoading(false)
  };

  const otpManagement = async (e) =>{ 
    e.preventDefault();
    let isValid = true;
    let tempErrors = {};
    setLoading(true)
    setErrors({});
    if (!validateEmail(email)) {
      tempErrors.email = "Please enter a valid email address.";
      isValid = false;
    }
    setErrors(tempErrors);
    if(isValid){
      try{
        const response = await fetch('https://onlinejudge-1-y4g1.onrender.com/api/otpManager',{
          method: 'POST',
          headers: {
            'Content-Type' : 'application/json',
          },
          body : JSON.stringify({
            email:email
          })
        });
        const data = await response.json()
        if(data.success) {
          setSteps('otpverify')
        }
        else{
          setErrors({email:"This email already exists"})
        }
      }catch(error){
        alert(error)
      } 
    }
    setLoading(false)
  }

  const otpVerifier = async (e) =>{ 
    e.preventDefault();
    let isValid = true;
    setErrors({});
    setLoading(true)
    if(isValid){
      try{
        const response = await fetch('https://onlinejudge-1-y4g1.onrender.com/api/otpVerify',{
          method: 'POST',
          headers: {
            'Content-Type' : 'application/json',
          },
          body : JSON.stringify({
            email:email,
            otp:otp
          })
        });
        const data = await response.json()
        if(data.success) {
          setSteps('Register')
        }
        else{
          setErrors({otp:"Invalid Otp!"})
        }
      }catch(error){
        alert(error)
      } 
    }
    setLoading(false)
  }

  return ( 
    loading? (
      <RegisterLoader/>
    ) : (
      <div className="login-container">
        <h2>Sign Up</h2>
    
        {steps === 'manager' && (
          <form onSubmit={otpManagement}>
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
            <div className="actions">
              <button type="submit">Verify Email!</button>
              <button type="button" onClick={handleLoginRoute}>Already exist user..Login</button>
            </div>
          </form>
        )}
    
        {steps === 'otpverify' && (
          <form onSubmit={otpVerifier}>
            <div className="input-group">
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <label htmlFor="otp">Otp</label>
              {errors.otp && <div className="error-message">{errors.otp}</div>}
            </div>
            <div className="actions">
              <button type="submit">Verify Otp!</button>
            </div>
          </form>
        )}
    
        {steps === 'Register' && (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label htmlFor="username">Username</label>
              {errors.username && (
                <div className="error-message">{errors.username}</div>
              )}
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
            <div className="input-group">
              <input
                type="password"
                id="conPassword"
                value={conPassword}
                onChange={(e) => setConPassword(e.target.value)}
                required
              />
              <label htmlFor="conPassword">Confirm Password</label>
              {errors.conPassword && (
                <div className="error-message">{errors.conPassword}</div>
              )}
            </div>
            <div className="actions">
              <button type="submit">Sign Up</button>
              <button type="button" onClick={handleLoginRoute}>Already exist User..Login</button>
            </div>
          </form>
        )}
      </div>
    )
  )
};

export default Register;

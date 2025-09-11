import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/navbar';
import Login from './components/loginpage';
import Register from './components/registerpage';
import ProblemList from './components/home';
import './App.css'
import Problems from './components/problem';
import Profile from './components/Profile';
import Contest from './components/contest';
import ContestProblem from './components/contestProblem';
import ProblemDesc from './components/ProblemDesc';
import RegisterContest from './components/registerContest';
import Leaderboard from './components/Leaderboard';
import ContestUpdate from './components/contestUpdate';
import { useEffect, useState } from 'react';

function App() {

  const [Already,setAlready] = useState(false);

  useEffect(()=>{
    const isloggedin = async()=>{
      try{
        const response = await fetch('https://onlinejudge-1-y4g1.onrender.com/api/checkUser',{
          method : 'GET',
          credentials : 'include'
        })
        const data = await response.json();
        console.log(data);
        if(data.Success){
          setAlready(true);
        }
        else{
          console.log(data.message)
        }
      }catch(err){
        console.log(err)
      }
    }
    isloggedin();
  },[])

  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      {location.pathname !== '/' && location.pathname !== '/signup' && <Navbar />}
      {location.pathname === '/' && Already && navigate('/home')}
      <Routes>
        <Route path='/signup' element={<Register />} />
        <Route path='/' element={<Login />} />
        <Route path='/home' element={<ProblemList />} />
        <Route path='/contest' element={<Contest />} />
        <Route path='/registerContest' element={<RegisterContest />} />
        <Route path='/contest/:id' element={<ContestProblem/>} />
        <Route path='/problems/:id' element={<Problems />} />
        <Route path='/problemdesc/:id' element={<ProblemDesc/>} />
        <Route path='/contestUpdate' element={<ContestUpdate/>} />
        <Route path='/profile' element={<Profile/>}/>
        <Route path='/Leaderboard' element={<Leaderboard/>}/>
      </Routes>
    </>
  );
}

export default function RootApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}

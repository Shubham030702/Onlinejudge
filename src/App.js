import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
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

function App() {
  
  const location = useLocation();
  return (
    <>
      {location.pathname !== '/' && location.pathname !== '/signup' && <Navbar />}
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

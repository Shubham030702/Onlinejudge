import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/navbar';
import Login from './components/loginpage';
import Register from './components/registerpage';
import ProblemList from './components/home';
import './App.css'
import Problems from './components/problem';

function App() {
  const location = useLocation();
  
  return (
    <>
      {location.pathname !== '/' && location.pathname !== '/signup' && <Navbar />}
      <Routes>
        <Route path='/signup' element={<Register />} />
        <Route path='/' element={<Login />} />
        <Route path='/home' element={<ProblemList />} />
        <Route path='/problems/:id' element={<Problems />} />
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

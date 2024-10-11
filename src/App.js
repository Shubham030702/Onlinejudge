import logo from './logo.svg';
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";

import Login from './components/loginpage';
import Register from './components/registerpage';
function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path='/' element={<Register/>}/>
        <Route path='/Login' element={<Login/>}/>
      </Routes>
    </Router>
    </>
  );
}

export default App;

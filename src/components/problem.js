import React from 'react'
import { useState , useEffect} from 'react';
import './problem.css'
import Editor from '@monaco-editor/react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {formatTimestamp} from './utils'
import Loader from './loader.js'

function Problems() {
  const [height, setHeight] = useState(50);
  const [status, setstatus] = useState(null);
  const [input, setinput] = useState(null);
  const [output, setoutput] = useState(null);
  const [expoutput, setexpoutput] = useState(null);
  const location = useLocation();
  const {problemData} = location.state;
  const [code,setCode] = useState("// write your code here ");
  const [loading, setLoading] = useState(false); 
  const [view , setview] = useState('Description');
  const [userdata, setUserdata] = useState(null);
  const [solution, setsolution] = useState(null);
  const [time,settime] = useState(null);
  const [language, setLanguage] = useState(52);

  useEffect(() => {
    const fetchuser = async () => {
      try {
        const response = await fetch('https://onlinejudge-3.onrender.com/api/userdata', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'content-type': 'application/json'
          }
        });
        if (response.ok) {
          setUserdata(await response.json());
        } else {
          const errorData = await response.json();
          console.error('Error:', errorData.message);
        }
      } catch (error) {
        console.error('Fetch user error:', error);
      }
    };

    fetchuser();
  }, []);

  const problemdesc={
    ProblemName : problemData.problemName,
    Language : language,
    Code: code
  }

  const submitprob = async() =>{
    setview('Evaluation');
    setinput(null);
    setoutput(null);
    setexpoutput(null);
    setLoading(true)
    try{  
      const response = await fetch('https://onlinejudge-3.onrender.com/api/submission',{
        method:'POST',
        credentials:'include',
        headers:{
          'content-type': 'application/json'
        },
        body : JSON.stringify({problemdesc})
      })
      const result = await response.json();
      console.log(result)
      if(!result.result){
        setstatus(result.status)
        settime(result.time);
      }
      else{
        setstatus(result.result.status.description)
        setinput(result.input)
        setoutput(result.decode)
        setexpoutput(result.output)
      }
    }catch(error){
      alert(error)
    }
    setLoading(false)
  }

  const runprob= async()=>{
    setview('Evaluation');
    setinput(null);
    setoutput(null);
    setexpoutput(null);
    setLoading(true)
    try{  
      const response = await fetch('https://onlinejudge-3.onrender.com/api/runprob',{
        method:'POST',
        headers:{
          'content-type': 'application/json'
        },
        body : JSON.stringify({problemdesc})
      })
      const result = await response.json();
      if(!result.result){
        setstatus(result.status)
        settime(result.time);
      }
      else{
        setstatus(result.result.status.description)
        setinput(result.input)
        setoutput(result.decode)
        setexpoutput(result.output)
      }
    }catch(error){
      alert(error)
    }
    setLoading(false)
  }

  const handleChange = (event) => {
    if(event.target.value === "cpp"){ 
      console.log(52);
      setLanguage(52); 
    }
    else if(event.target.value === "java"){ 
      console.log(62);
      setLanguage(62); 
    }
    else if(event.target.value === "python"){ 
      console.log(71);
      setLanguage(71); 
    }
    else if(event.target.value === "javascript"){ 
      console.log(63);
      setLanguage(63); 
    }
  };
  
  const handleMouseDown = (e) => {
    const startY = e.clientY;
    const startHeight = height;
    const onMouseMove = (e) => {
      const newHeight = startHeight + ((e.clientY - startY) / window.innerHeight) * 100;
      setHeight(Math.min(90, Math.max(10, newHeight))); 
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const changeView = (e,s) =>{
    if(e === 'Submitted'){
      setsolution(s)
    }
    setview(e);
  }

  return (
    <>
    <div className="context">
      <div className="left">
      <div className="content">
      <h3 onClick={() => changeView('Description',null)}>Description</h3>
  	  <h3 onClick={() => changeView('Editorial',null)}>Editorial</h3>
      <h3 onClick={() => changeView('Solutions',null)}>Solutions</h3>
      <h3 onClick={() => changeView('Submissions',null)}>Submissions</h3>
      </div>
      <div className="leftbottom">
      {view === 'Description' && (
        <>
        <h1>{problemData.problemName}</h1>
        <h3>{problemData.difficulty}</h3>
        <h4>{problemData.topics.map(t=>(<p>{t}</p>))}</h4>
        <ReactMarkdown>{problemData.statement}</ReactMarkdown>
        </>
      )}
      {view === 'Editorial' && (
        <ReactMarkdown>{problemData.editorial}</ReactMarkdown>
      )}
      {view === 'Submissions' && (
        <>
        {userdata && 
         <div className="listsubmissions">
         <ul>
         {userdata.Submissions.map((submission, index) => {
          if (submission.Problem._id === problemData._id) {
              return (
                  <div className='listitem' key={index}>
                      <h3>{submission.Status}</h3>    
                      <h3 className="itemSolution" style={{ color: 'seashell'}} onClick={() => changeView('Submitted',submission.Solution)}>Solution</h3>  
                      <h3>{formatTimestamp(submission.Time)}</h3> 
                  </div>
              );
          }
          return "No Submission Made Yet {NSMY} :)";
          })}
         </ul>
     </div>
        }
        </>
      )}
      {view === 'Submitted' && (
          <>
          <Editor
          height="100%"
          width="100%" 
          defaultValue={solution}
          theme="vs-dark"
          />
          </>
        )
      }
      {view === 'Solutions' && (
        <>
          {problemData && 
         <div className="listsubmissions">
         <ul>
         {problemData.users.map((user, index) => {
              return (
                  <div className='listitem' key={index}>
                      <h3>{user.Username}</h3>    
                      <h3>{user.Status}</h3>    
                      <h3 className="itemSolution" style={{ color: 'seashell'}} onClick={() => changeView('Submitted',user.Solution)}>Solution</h3>  
                      <h3>{formatTimestamp(user.Time)}</h3> 
                  </div>
              );
          })}
         </ul>
     </div>
        }
      </>
      )}
      {
        view === 'Evaluation' && (
          <>
          { loading? <div className="loading">
          <Loader/>
          </div>:
          <div className="evaluation">
          <h3>Time Took : {time} s</h3>
          <h1>{status}</h1>
            {input && <h2>Input: {input}</h2>}
            {output && <h2>Your Output: {output}</h2>}
            {expoutput && <h2>Expected Output: {expoutput}</h2>}
          </div>      
          }
          </>
        )
      }
      </div>
      </div>
      <div className="right">
      <div className="probsubmit">
        <button className='submit' onClick={submitprob}>Submit</button>
        <button onClick={runprob}>Run</button>
        <div className='language'>
        <select id="language" onChange={(event) => handleChange(event)} name="language">
          <option value="cpp">C++</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>

        </div>
      </div>
      <Editor
        height={`${height}%`}
        width="100%" 
        defaultLanguage="cpp"
        defaultValue={code}
        theme="vs-dark"
        onChange={(value)=>setCode(value)}
      />
      <div className="resizer" onMouseDown={handleMouseDown}></div>
      <div className="tests" style={{ height: `${100 - height}%` }}>
      {
    problemData.testCases.slice(0, 2).map((testCase, index) => (
      <div key={index} className="test-case">
        <h2>Test case {index + 1}: </h2>
        <h3><strong>Input:</strong> {testCase.input}</h3>
        <h3><strong>Output:</strong> {testCase.output}</h3>
        <br />
      </div>
    ))}
      </div>
      
    </div>
    </div>
    </>
  )
}

export default Problems
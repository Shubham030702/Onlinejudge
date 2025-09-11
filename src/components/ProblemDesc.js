import React from 'react'
import { useState } from 'react';
import './problem.css'
import Editor from '@monaco-editor/react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Loader from './loader.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

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
  const [time,settime] = useState(null);
  const [language, setLanguage] = useState(52);
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
      const response = await fetch('http://localhost:5000/api/Contestsubmission',{
        method:'POST',
        credentials:'include',
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

  const runprob= async()=>{
    setview('Evaluation');
    setinput(null);
    setoutput(null);
    setexpoutput(null);
    setLoading(true)
    try{  
      const response = await fetch('http://localhost:5000/api/runprob',{
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
      setLanguage(52); 
    }
    else if(event.target.value === "java"){ 
      setLanguage(62); 
    }
    else if(event.target.value === "python"){ 
      setLanguage(71); 
    }
    else if(event.target.value === "javascript"){ 
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
    setview(e);
  }

  return (
    <>
    <div className="context">
      <div className="left">
      <div className="content">
      <h3 onClick={() => changeView('Description',null)}>Description</h3>
      </div>
      <div className="leftbottom">
      {view === 'Description' && (
        <>
        <div className="NameProblem"><h1 style={{"color":"wheat"}}>{problemData.problemName}</h1>
        </div>
        <ReactMarkdown>{problemData.statement}</ReactMarkdown>
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
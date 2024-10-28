import React from 'react'
import { useState } from 'react';
import './problem.css'
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

function Problems() {
  const [height, setHeight] = useState(50);

  const location = useLocation();
  const {problemData} = location.state;
  const [isVisible, setIsVisible] = useState(false);
  const [code,setCode] = useState("// write your code here ");

  const submitprob = async() =>{
    const problemdesc={
      ProblemName : problemData.problemName,
      Code: code
    }
    try{  
      const response = await fetch('http://localhost:5000/api/submission',{
        method:'POST',
        headers:{
          'content-type': 'application/json'
        },
        body : JSON.stringify({problemdesc})
      })
    }catch(error){
      alert(error)
    }
  }

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
    console.log(height)
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
    <div className="context">
      <div className="left">
      <h1>{problemData.problemName}</h1>
      <h3>{problemData.difficulty}</h3>
      <h4>{problemData.topics.map(t=>(<p>{t}</p>))}</h4>
      <ReactMarkdown>{problemData.statement}</ReactMarkdown>
      </div>
      <div className="right">
      <div className="probsubmit">
        <button onClick={submitprob}>Submit</button>
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
      {problemData.testCases.map((testCase, index) => (
      <div key={index} className="test-case">
        <h2>Test case {index+1}: </h2>
        <h3><strong>Input : </strong>   {testCase.input}</h3>
        <h3><strong>Output :</strong>   {testCase.output}</h3>
        <br/>
      </div>
      ))}
      </div>
      
    </div>
    </div>
    </>
  )
}

export default Problems
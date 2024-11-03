import React from 'react'
import { useState , useEffect} from 'react';
import './problem.css'
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Audio } from 'react-loader-spinner';

function Problems() {
  const [height, setHeight] = useState(50);
  const [status, setstatus] = useState(null);
  const [input, setinput] = useState(null);
  const [output, setoutput] = useState(null);
  const [expoutput, setexpoutput] = useState(null);
  const location = useLocation();
  const {problemData} = location.state;
  const [isVisible, setIsVisible] = useState(false);
  const [code,setCode] = useState("// write your code here ");
  const [loading, setLoading] = useState(false); 
  const [view , setview] = useState('Description');
  const [userdata, setUserdata] = useState(null);
  useEffect(() => {
    const fetchuser = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/userdata', {
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
  const submitprob = async() =>{
    const problemdesc={
      ProblemName : problemData.problemName,
      Code: code
    }
    setLoading(true)
    try{  
      const response = await fetch('http://localhost:5000/api/submission',{
        method:'POST',
        credentials:'include',
        headers:{
          'content-type': 'application/json'
        },
        body : JSON.stringify({problemdesc})
      })
      const result = await response.json();
      console.log(result)
      if(result === "Accepted"){
        setstatus('Accepted')
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
    const problemdesc={
      ProblemName : problemData.problemName,
      Code: code
    }
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
      if(result === "Accepted"){
        setstatus('Accepted')
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
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const changeView = (e) =>{
    setview(e);
  }
  console.log(problemData.users.Submissions)
  return (
    <>
    <div className="context">
      <div className="left">
      <div className="content">
      <h3 onClick={() => changeView('Description')}>Description</h3>
  	  <h3 onClick={() => changeView('Editorial')}>Editorial</h3>
      <h3 onClick={() => changeView('Solutions')}>Solutions</h3>
      <h3 onClick={() => changeView('Submissions')}>Submissions</h3>
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
        <h1>{userdata.Username}</h1>
        </>
      )}
      {view === 'Solutions' && (
        <ul>
        {
          problemData.users.map(e=>(
            <li>
              <p>{e.Username}</p>
            </li>
          ))
        }
      </ul>
      )}
      {view === 'Submitted' && (
          <>
          {problemData.users.map(user => (
            user.Submissions.filter(submission => submission.Problem === problemData._id)
              .map(filteredSubmission => (
                <li key={filteredSubmission._id}>
                  {filteredSubmission.Solution}
                </li>
              ))
          ))}
          </>
        )
      }
      </div>
      </div>
      <div className="right">
      <div className="probsubmit">
        <button className='submit' onClick={submitprob}>Submit</button>
        <button onClick={runprob}>Run</button>
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
        {loading && <Audio
          height="80"
          width="80"
          radius="9"
          color="green"
          ariaLabel="loading"
          wrapperStyle
          wrapperClass
        />}
      {status === null ? (
    problemData.testCases.map((testCase, index) => (
      <div key={index} className="test-case">
        <h2>Test case {index + 1}: </h2>
        <h3><strong>Input:</strong> {testCase.input}</h3>
        <h3><strong>Output:</strong> {testCase.output}</h3>
        <br />
      </div>
    ))
  ) : <><h1>{status}</h1>
  </>}
      </div>
      
    </div>
    </div>
    </>
  )
}

export default Problems
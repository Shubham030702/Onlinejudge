import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faClock, faCode, faVial } from '@fortawesome/free-solid-svg-icons';
import './problem.css'
import Editor from '@monaco-editor/react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {formatTimestamp} from './utils'
import Loader from './loader.js'
import CustomDropdown from './CustomDropdown';

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://onlinejudge-2.onrender.com')

function Problems() {
  const [height, setHeight] = useState(50);
  const [status, setstatus] = useState(null);
  const [input, setinput] = useState(null);
  const [output, setoutput] = useState(null);
  const [expoutput, setexpoutput] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const {problemData} = location.state || {};
  
  const [code,setCode] = useState(problemData ? problemData.boilerplate.cpp : "");
  const [loading, setLoading] = useState(false); 
  const [view , setview] = useState('Description');
  const [userdata, setUserdata] = useState(null);
  const [solution, setsolution] = useState(null);
  const [time,settime] = useState(null);
  const [evalDetails, setEvalDetails] = useState(null);
  const [language, setLanguage] = useState(52);
  const [languageName, setLanguageName] = useState("cpp");
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
    if (!problemData) {
        navigate('/');
        return;
    }
    const fetchuser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/userdata`, {
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
  }, [navigate, problemData]);

  const problemdesc={
    id : problemData?._id,
    Language : language,
    LanguageName : languageName,
    Code: code
  }

  const submitprob = async() =>{
    setview('Evaluation');
    setinput(null);
    setoutput(null);
    setexpoutput(null);
    setEvalDetails(null);
    setLoading(true)
    try{  
      const response = await fetch(`${API_URL}/api/submission`,{
        method:'POST',
        credentials:'include',
        headers:{
          'content-type': 'application/json'
        },
        body : JSON.stringify({problemdesc})
      })
      const result = await response.json();
      setEvalDetails({
        passedCount: result.passedCount ?? (result.status === 'Accepted' ? problemData.testCases.length : 0),
        totalCount: result.totalCount ?? problemData.testCases.length,
        testResults: result.testResults || [],
        isRun: false
      });
      settime(result.time ?? 0);
      if(!result.result){
        setstatus(result.status)
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
    setEvalDetails(null);
    setLoading(true)
    try{  
      const response = await fetch(`${API_URL}/api/runprob`,{
        method:'POST',
        headers:{
          'content-type': 'application/json'
        },
        body : JSON.stringify({problemdesc})
      })
      const result = await response.json();
      setEvalDetails({
        passedCount: result.passedCount ?? (result.status === 'Accepted' ? Math.min(2, problemData.testCases.length) : 0),
        totalCount: result.totalCount ?? Math.min(2, problemData.testCases.length),
        testResults: result.testResults || [],
        isRun: true
      });
      settime(result.time ?? 0);
      if(!result.result){
        setstatus(result.status)
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

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleChange = (event) => {
    let newCode = "";
    let newLang = "";
    if(event.target.value === "cpp"){ 
      newCode = problemData.boilerplate.cpp;
      setLanguage(52); 
      newLang = "cpp";
    }
    else if(event.target.value === "java"){ 
      newCode = problemData.boilerplate.java;
      setLanguage(62); 
      newLang = "java";
    }
    else if(event.target.value === "python"){ 
      newCode = problemData.boilerplate.python;
      setLanguage(71); 
      newLang = "python";
    }
    else if(event.target.value === "javascript"){ 
      newCode = problemData.boilerplate.js;
      setLanguage(63); 
      newLang = "javascript";
    }
    setLanguageName(newLang==="javascript"?"js":newLang)
    setCode(newCode);
    const newModel = monacoRef.current.editor.createModel(newCode, newLang);
    const oldModel = editorRef.current.getModel();
    editorRef.current.setModel(newModel);
    oldModel.dispose();
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

  if (!problemData) return null;

  return (
    <>
    <div className="context">
      <div className="left">
        <div className="content">
          {['Description', 'Editorial', 'Solutions', 'Submissions'].map((tab) => (
            <h3 
              key={tab} 
              className={view === tab ? 'active-tab' : ''} 
              onClick={() => changeView(tab, null)}
            >
              {tab}
            </h3>
          ))}
        </div>
        <div className="leftbottom">
          {view === 'Description' && (
            <>
            <div className="NameProblem">
              <h1>{problemData.problemName}</h1>
            </div>
            <div className="badges">
              <span className="badge-difficulty" style={{
                color: problemData.difficulty === "Easy" ? "#00e676" : problemData.difficulty === "Medium" ? "#ffcc00" : "#ff4444"
              }}>{problemData.difficulty}</span>
              {problemData.topics.map((t, idx) => (
                <span key={idx} className="badge-topic">{t}</span>
              ))}
            </div>
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
              if (!submission.Problem) return null;
              if (submission.Problem._id === problemData._id) {
                  return (
                      <div className='listitem' key={index}>
                          <h3>{submission.Status}</h3>    
                          <h3 className="itemSolution" onClick={() => changeView('Submitted',submission.Solution)}>Solution</h3>  
                          <h3>{formatTimestamp(submission.Time)}</h3> 
                      </div>
                  );
              }
              return null;
              })}
             </ul>
            </div>
            }
            </>
          )}
          {view === 'Submitted' && (
              <Editor
              height="100%"
              width="100%" 
              defaultValue={solution}
              theme="vs-dark"
              options={{ readOnly: true }}
              />
          )}
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
                          <h3 className="itemSolution" onClick={() => changeView('Submitted',user.Solution)}>Solution</h3>  
                          <h3>{formatTimestamp(user.Time)}</h3> 
                      </div>
                  );
              })}
             </ul>
             </div>
            }
          </>
          )}
          {view === 'Evaluation' && (
              <>
              { loading ? <div className="loading"><Loader messages={["Compiling Code...", "Running Test Cases...", "Evaluating Submission...", "Finishing evaluation..."]}/></div> : (
                (() => {
                  const isAccepted = status === 'Accepted';
                  const total = evalDetails?.totalCount || 0;
                  const passed = evalDetails?.passedCount ?? (isAccepted ? total : 0);
                  const passPct = total > 0 ? Math.round((passed / total) * 100) : (isAccepted ? 100 : 0);
                  const radius = 34;
                  const circumference = 2 * Math.PI * radius;
                  const dashOffset = circumference - (passPct / 100) * circumference;
                  const results = evalDetails?.testResults || [];
                  const maxTcTime = Math.max(0.001, ...results.map(r => r.time || 0));

                  return (
                    <div className="evaluation-dashboard">
                      <div className={`eval-verdict-banner ${isAccepted ? 'accepted' : 'failed'}`}>
                        <div className="eval-verdict-left">
                          <FontAwesomeIcon
                            icon={isAccepted ? faCircleCheck : faCircleXmark}
                            className="eval-verdict-icon"
                          />
                          <div>
                            <div className="eval-verdict-label">
                              {evalDetails?.isRun ? 'Sample Run Result' : 'Submission Verdict'}
                            </div>
                            <h1 className="eval-verdict-title">{status || 'Evaluated'}</h1>
                          </div>
                        </div>

                        <div className="eval-ring-wrap">
                          <svg width="84" height="84" viewBox="0 0 84 84" className="eval-ring-svg">
                            <circle cx="42" cy="42" r={radius} className="eval-ring-track" />
                            <circle
                              cx="42"
                              cy="42"
                              r={radius}
                              className={`eval-ring-fill ${isAccepted ? 'accepted' : 'failed'}`}
                              strokeDasharray={circumference}
                              strokeDashoffset={dashOffset}
                            />
                          </svg>
                          <div className="eval-ring-text">
                            <strong>{passPct}%</strong>
                            <span>Passed</span>
                          </div>
                        </div>
                      </div>

                      <div className="eval-metrics-grid">
                        <div className="eval-metric-card">
                          <div className="eval-metric-head">
                            <FontAwesomeIcon icon={faVial} />
                            <span>Testcases</span>
                          </div>
                          <div className="eval-metric-val">
                            {passed} <span>/ {total}</span>
                          </div>
                        </div>
                        <div className="eval-metric-card">
                          <div className="eval-metric-head">
                            <FontAwesomeIcon icon={faClock} />
                            <span>Total Runtime</span>
                          </div>
                          <div className="eval-metric-val">
                            {time ?? 0} <span>sec</span>
                          </div>
                        </div>
                        <div className="eval-metric-card">
                          <div className="eval-metric-head">
                            <FontAwesomeIcon icon={faCode} />
                            <span>Language</span>
                          </div>
                          <div className="eval-metric-val">
                            {languageName.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {total > 0 && (
                        <div className="eval-section-card">
                          <div className="eval-section-header">
                            <span>Testcase Execution Matrix</span>
                            <span className="eval-section-sub">{passed} of {total} passed</span>
                          </div>
                          <div className="eval-tc-grid">
                            {Array.from({ length: total }).map((_, idx) => {
                              const tc = results[idx];
                              const tcState = tc ? (tc.passed ? 'passed' : 'failed') : 'skipped';
                              return (
                                <div key={idx} className={`eval-tc-pill ${tcState}`} title={tc ? `Case ${idx + 1}: ${tc.status} (${tc.time}s)` : `Case ${idx + 1}: Not executed`}>
                                  <span className="eval-tc-dot" />
                                  <span>Case {idx + 1}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {results.length > 0 && (
                        <div className="eval-section-card">
                          <div className="eval-section-header">
                            <span>Per-Testcase Runtime</span>
                            <span className="eval-section-sub">Execution time (s)</span>
                          </div>
                          <div className="eval-bars">
                            {results.map((tc) => {
                              const widthPct = Math.max(8, Math.round(((tc.time || 0) / maxTcTime) * 100));
                              return (
                                <div key={tc.index} className="eval-bar-row">
                                  <span className="eval-bar-label">TC {tc.index}</span>
                                  <div className="eval-bar-track">
                                    <div
                                      className={`eval-bar-fill ${tc.passed ? 'passed' : 'failed'}`}
                                      style={{ width: `${widthPct}%` }}
                                    />
                                  </div>
                                  <span className="eval-bar-time">{tc.time.toFixed(3)}s</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {(input || output || expoutput) && (
                        <div className="eval-section-card eval-io-card">
                          <div className="eval-section-header">
                            <span>Failed Testcase Details</span>
                          </div>
                          {input && (
                            <div className="eval-io-block">
                              <span className="eval-io-label">Input</span>
                              <pre>{input}</pre>
                            </div>
                          )}
                          {output && (
                            <div className="eval-io-block">
                              <span className="eval-io-label">Your Output</span>
                              <pre>{output}</pre>
                            </div>
                          )}
                          {expoutput && (
                            <div className="eval-io-block">
                              <span className="eval-io-label">Expected Output</span>
                              <pre>{expoutput}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
              </>
          )}
        </div>
      </div>
      <div className="right">
        <div className="probsubmit">
          <div className='language'>
            <CustomDropdown 
              options={[
                { value: "cpp", label: "C++" },
                { value: "javascript", label: "JavaScript" },
                { value: "python", label: "Python" },
                { value: "java", label: "Java" }
              ]}
              value={languageName === "js" ? "javascript" : languageName}
              onChange={(val) => handleChange({ target: { value: val } })}
              placeholder="Select Language"
            />
          </div>
          <div className="action-buttons">
            <button className='run-btn' onClick={runprob}>Run</button>
            <button className='submit-btn' onClick={submitprob}>Submit</button>
          </div>
        </div>
        <Editor
          height={`${height}%`}
          width="100%" 
          defaultLanguage="cpp"        
          onMount = {handleEditorDidMount}
          defaultValue = {code}
          theme="vs-dark"
          onChange={(value)=>setCode(value)}
        />
        <div className="resizer" onMouseDown={handleMouseDown}></div>
        <div className="tests" style={{ height: `${100 - height}%` }}>
          {problemData.testCases.slice(0, 2).map((testCase, index) => (
            <div key={index} className="test-case">
              <h2>Testcase {index + 1}</h2>
              <h3><strong>Input:</strong> {testCase.input}</h3>
              <h3><strong>Output:</strong> {testCase.output}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}

export default Problems
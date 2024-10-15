import React from 'react'
import './problem.css'
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

function Problems() {
  const location = useLocation();
  const {problemData} = location.state;
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
          <div className="resizable-editor">
          <Editor
            height="100%"
            width="100%" 
            defaultLanguage="c++"
            defaultValue="// Write your code here"
            theme='vs-dark'
          />
          </div>
      </div>
    </div>
    </>
  )
}

export default Problems
import React from 'react'
import './problem.css'
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';


function Problems() {
  return (
    <>
    <div className="context">
    <div className="left">
    <h1>Problem statement</h1>
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
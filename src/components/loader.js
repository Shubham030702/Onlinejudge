import React, { useEffect, useRef } from 'react';
import './loader.css';

const Loader = ({ messages }) => {
  const loaderTextRef = useRef(null);

  useEffect(() => {
    const defaultMessages = [
      "Initializing...",
      "Get Ready...",
      "To discover the Best...",
      "Coding Platform...",
      "AceCode...",
      "#Hustling For Glory..."
    ];
    const activeMessages = messages && messages.length > 0 ? messages : defaultMessages;

    let index = 0;
    if (loaderTextRef.current && activeMessages.length > 0) {
      loaderTextRef.current.textContent = activeMessages[index];
      index = (index + 1) % activeMessages.length;
    }

    const interval = setInterval(() => {
      if (loaderTextRef.current && activeMessages.length > 0) {
        loaderTextRef.current.textContent = activeMessages[index];
        index = (index + 1) % activeMessages.length;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div id="cyber-loader">
      <div id="glitch-text" ref={loaderTextRef}>Initializing...</div>
      <div className="scanline"></div>
    </div>
  );
};

export default Loader;

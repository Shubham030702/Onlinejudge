import './RegisterLoader.css'

import React, { useEffect, useRef } from 'react';

const CyberLoader = () => {
  const loaderTextRef = useRef(null);

  useEffect(() => {
    const messages = [
      "Initializing SigningUp...",
      "Get Ready...",
      "To discover the Best...",
      "Coding Platform...",
      "AceCode...",
      "#Hustling For Glory..."
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (loaderTextRef.current) {
        loaderTextRef.current.textContent = messages[index];
        index = (index + 1) % messages.length;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div id="cyber-loader">
        <div id="glitch-text" ref={loaderTextRef}>Initializing...</div>
        <div className="scanline"></div>
      </div>

      <div id="content" style={{ display: "none" }}>
        <h1>Welcome Runner</h1>
      </div>
    </>
  );
};

export default CyberLoader;

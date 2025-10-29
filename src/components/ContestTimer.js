import React, { useState, useEffect } from "react";
import "./ContestTimer.css"

function ContestTimer({ startTime, endTime }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (now < start) {
        setStatus("Contest not started yet");
        const diff = start - now;
        setTimeLeft(formatTime(diff));
      } else if (now >= start && now < end) {
        setStatus("Contest running");
        const diff = end - now;
        setTimeLeft(formatTime(diff));
      } else {
        setStatus("Contest ended");
        setTimeLeft("00:00:00");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const formatTime = (ms) => {
    let totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const pad = (n) => (n < 10 ? "0" + n : n);

  return (
    <div className="timer">
      <h2>{status}</h2>
      <h1>{timeLeft}</h1>
    </div>
  );
}

export default ContestTimer;

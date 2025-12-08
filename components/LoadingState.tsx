
import React, { useState, useEffect } from 'react';
import { CogIcon } from './Icons';

const loadingMessages = [
  "Consulting the Emperor's Tarot...",
  "Analyzing warp fluctuations...",
  "Placating the machine spirit...",
  "Decoding the data-slate...",
  "Purging chaotic influence...",
  "Recalibrating the cogitators...",
  "Awaiting astropathic message...",
  "Compiling Inquisitorial report...",
];

const LoadingState: React.FC = () => {
  const [message, setMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = loadingMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 bg-[url('https://www.transparenttextures.com/patterns/gplay.png')]">
      <CogIcon className="w-24 h-24 text-red-500 animate-spin" />
      <h2 className="mt-8 text-2xl font-semibold text-gray-300 tracking-wider">Generating World State</h2>
      <p className="mt-2 text-lg text-gray-400 transition-opacity duration-500">{message}</p>
    </div>
  );
};

export default LoadingState;

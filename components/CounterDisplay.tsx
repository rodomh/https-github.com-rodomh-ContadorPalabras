
import React from 'react';

interface CounterDisplayProps {
  count: number;
  isListening: boolean;
}

const CounterDisplay: React.FC<CounterDisplayProps> = ({ count, isListening }) => {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div 
        className={`absolute -top-8 text-xs font-bold uppercase tracking-wider transition-opacity duration-300 ${isListening ? 'opacity-100 text-highlight' : 'opacity-0'}`}
      >
        Listening...
      </div>
      <div className="text-8xl md:text-9xl font-mono font-bold text-text-main transition-colors duration-300" style={{ textShadow: '0 0 20px rgba(56, 178, 172, 0.5)' }}>
        {count}
      </div>
    </div>
  );
};

export default CounterDisplay;

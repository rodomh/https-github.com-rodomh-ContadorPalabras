import React, { useState, useEffect, useCallback } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import MaintenancePanel from './components/MaintenancePanel';
import CounterDisplay from './components/CounterDisplay';
import ControlButton from './components/ControlButton';
import { PHRASES_STORAGE_KEY, SUPPORTED_LANGUAGES, DEFAULT_PHRASES } from './constants';
import { Language, Phrase } from './types';

const App: React.FC = () => {
  const [count, setCount] = useState<number>(0);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [showMaintenance, setShowMaintenance] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ar-SA');
  
  // Load phrases from localStorage on initial render, or set defaults
  useEffect(() => {
    try {
      const storedPhrases = localStorage.getItem(PHRASES_STORAGE_KEY);
      if (storedPhrases) {
        const parsedPhrases = JSON.parse(storedPhrases);
        setPhrases(parsedPhrases);
        // Recalculate total count from stored data
        const totalCount = parsedPhrases.reduce((sum: number, p: Phrase) => sum + p.count, 0);
        setCount(totalCount);
      } else {
        setPhrases(DEFAULT_PHRASES);
      }
    } catch (error) {
      console.error("Failed to load phrases from localStorage", error);
      setPhrases(DEFAULT_PHRASES);
    }
  }, []);

  // Save phrases to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(PHRASES_STORAGE_KEY, JSON.stringify(phrases));
    } catch (error) {
      console.error("Failed to save phrases to localStorage", error);
    }
  }, [phrases]);
  
  const handleMatch = useCallback((matchedPhrase: string) => {
    setCount(prev => prev + 1);
    setPhrases(prevPhrases => 
      prevPhrases.map(p => 
        p.text === matchedPhrase ? { ...p, count: p.count + 1 } : p
      )
    );
  }, []);

  const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({
    phrases: phrases.map(p => p.text),
    onMatch: handleMatch,
    lang: language,
  });

  const handleReset = () => {
    setCount(0);
    setPhrases(prev => prev.map(p => ({...p, count: 0})));
    if (isListening) {
      stopListening();
    }
  };

  const handleAddPhrase = (phraseText: string) => {
    const lowerCaseText = phraseText.toLowerCase();
    if (phraseText && !phrases.some(p => p.text === lowerCaseText)) {
      setPhrases(prev => [...prev, { text: lowerCaseText, count: 0 }]);
    }
  };

  const handleDeletePhrase = (phraseToDelete: string) => {
    setPhrases(prev => prev.filter(p => p.text !== phraseToDelete));
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-900 text-white p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Browser Not Supported</h1>
          <p>Your browser does not support the Web Speech Recognition API. Please try Chrome or another supported browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between p-4 md:p-8 bg-primary">
      <header className="w-full max-w-4xl flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-highlight">Dhikr Counter</h1>
        <ControlButton onClick={() => setShowMaintenance(!showMaintenance)} variant="secondary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </ControlButton>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl text-center">
        <CounterDisplay count={count} isListening={isListening} />
        <div className="mt-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center">
          <ControlButton onClick={toggleListening} variant={isListening ? 'danger' : 'primary'} className="w-full sm:w-48">
            {isListening ? 'Stop' : 'Start'}
          </ControlButton>
          <ControlButton onClick={handleReset} variant="secondary" className="w-full sm:w-48">
            Reset
          </ControlButton>
        </div>
      </main>

      <footer className="w-full max-w-4xl">
        <div className="w-full flex justify-center mt-8">
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-secondary border border-accent text-text-main text-sm rounded-lg focus:ring-highlight focus:border-highlight block w-full max-w-xs p-2.5"
                disabled={isListening}
            >
                {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
            </select>
        </div>
        <p className="text-center text-text-dim text-xs mt-4">
            For best results, keep this page open and your screen on.
        </p>
      </footer>

      <MaintenancePanel 
        isOpen={showMaintenance}
        onClose={() => setShowMaintenance(false)}
        phrases={phrases}
        onAddPhrase={handleAddPhrase}
        onDeletePhrase={handleDeletePhrase}
      />
    </div>
  );
};

export default App;
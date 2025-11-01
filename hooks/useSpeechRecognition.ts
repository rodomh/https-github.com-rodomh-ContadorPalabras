import { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from '../types';

// TypeScript definitions for the Web Speech API.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionError) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionError extends Event {
  readonly error: string;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

interface SpeechRecognitionHookProps {
  phrases: string[];
  onMatch: (matchedPhrase: string) => void;
  lang: Language;
}

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSupported = !!SpeechRecognitionAPI;

export const useSpeechRecognition = ({ phrases, onMatch, lang }: SpeechRecognitionHookProps) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const onMatchRef = useRef(onMatch);
  useEffect(() => { onMatchRef.current = onMatch; }, [onMatch]);
  
  const phrasesRef = useRef(phrases);
  useEffect(() => { phrasesRef.current = phrases; }, [phrases]);
  
  const userStoppedRef = useRef(false);

  const startListening = useCallback(() => {
    if (isListening || !isSupported) return;
    userStoppedRef.current = false;
    setIsListening(true);
  }, [isListening]);

  const stopListening = useCallback(() => {
    userStoppedRef.current = true;
    if (recognitionRef.current) {
      // Detach onend handler before stopping to prevent it from trying to restart.
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      return;
    }

    let localRecognition: SpeechRecognition | null = null;
    let isActive = true;

    const start = () => {
      // Guard against starting if the effect is no longer active or if user stopped.
      if (!isActive || userStoppedRef.current) return;

      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;
      localRecognition = recognition;
      
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onend = () => {
        // If the stop was not initiated by the user, and we are still in a listening state,
        // we create a new instance and start again. This is more robust than reusing the old one.
        if (isActive && !userStoppedRef.current && isListening) {
          console.log('Recognition ended unexpectedly, restarting...');
          start();
        } else {
          recognitionRef.current = null;
          // Only set listening to false if it was a deliberate stop or error.
          if(userStoppedRef.current) setIsListening(false);
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionError) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          userStoppedRef.current = true;
          setIsListening(false);
        }
        // 'onend' will fire after most errors, letting our logic handle the restart.
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        
        const currentPhrases = phrasesRef.current;
        const matchedPhrase = currentPhrases.find(phrase => transcript.includes(phrase.toLowerCase()));

        if (matchedPhrase) {
          onMatchRef.current(matchedPhrase);
        }
      };
      
      recognition.start();
    };
    
    start();

    // Cleanup function for this effect
    return () => {
      isActive = false;
      if (localRecognition) {
        localRecognition.onend = null; 
        localRecognition.stop();
        recognitionRef.current = null;
      }
    };
  }, [isListening, lang]);
  
  return {
    isListening,
    startListening,
    stopListening,
    isSupported,
  };
};
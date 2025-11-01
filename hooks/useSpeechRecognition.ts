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
  
  // Using refs to hold the latest callbacks and data without re-triggering the main effect.
  const onMatchRef = useRef(onMatch);
  useEffect(() => { onMatchRef.current = onMatch; }, [onMatch]);
  
  const phrasesRef = useRef(phrases);
  useEffect(() => { phrasesRef.current = phrases; }, [phrases]);
  
  // This ref tracks if the user explicitly called stop, to differentiate from an auto-stop by the browser.
  const userStoppedRef = useRef(false);

  const startListening = useCallback(() => {
    if (isListening || !isSupported) return;
    userStoppedRef.current = false;
    setIsListening(true);
  }, [isListening]);

  const stopListening = useCallback(() => {
    userStoppedRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onend = () => {
      // If the stop was not initiated by the user, and we are still in a listening state,
      // then we should restart. This robustly handles browser auto-stops.
      if (!userStoppedRef.current && isListening) {
        recognition.start();
      } else {
        recognitionRef.current = null;
        setIsListening(false); // Sync state just in case
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionError) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        userStoppedRef.current = true;
        setIsListening(false);
      }
      // For other errors, `onend` will fire, and our logic there will attempt a restart if appropriate.
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

    // Cleanup function for this effect
    return () => {
      if (recognitionRef.current) {
        // Prevent onend from firing during a cleanup-related stop
        recognitionRef.current.onend = null; 
        recognitionRef.current.stop();
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

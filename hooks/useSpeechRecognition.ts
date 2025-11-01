import { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from '../types';

// FIX: Add TypeScript definitions for the Web Speech API.
// This is necessary because these types are not standard in all TypeScript DOM library versions.
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

// Check for SpeechRecognition API
// FIX: Rename variable to avoid conflict with the 'SpeechRecognition' interface type.
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSupported = !!SpeechRecognitionAPI;

export const useSpeechRecognition = ({ phrases, onMatch, lang }: SpeechRecognitionHookProps) => {
  const [isListening, setIsListening] = useState(false);
  // FIX: 'SpeechRecognition' now correctly refers to the interface type, resolving the type error.
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);
  
  const startListening = useCallback(() => {
    if (isListening || !isSupported) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Automatically restart listening if it wasn't stopped manually
      if (recognitionRef.current) {
          recognition.start();
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionError) => {
      console.error('Speech recognition error:', event.error);
      // Don't set isListening to false here to allow automatic restart
      if (event.error === 'no-speech' || event.error === 'network') {
          // It can try to restart on its own
      } else {
          setIsListening(false);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log('Transcript:', transcript);
      
      const matchedPhrase = phrases.find(phrase => transcript.includes(phrase.toLowerCase()));

      if (matchedPhrase) {
        console.log('Match found!', matchedPhrase);
        onMatch(matchedPhrase);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, phrases, onMatch, lang]);
  
  const manualStop = useCallback(() => {
    if (recognitionRef.current) {
      // setting ref to null prevents onend from restarting
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.stop();
      setIsListening(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  return {
    isListening,
    startListening,
    stopListening: manualStop,
    isSupported,
  };
};

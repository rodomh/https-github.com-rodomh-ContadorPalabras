
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
  // Ref to hold the intended listening state to prevent race conditions with async browser APIs.
  const intendedListeningRef = useRef(false);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      intendedListeningRef.current = false;
      recognitionRef.current.stop();
    }
  }, []);
  
  const startListening = useCallback(() => {
    if (intendedListeningRef.current || !isSupported) return;

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    intendedListeningRef.current = true;
    
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      // If the stop was not intentional (i.e., user didn't click Stop), 
      // restart the recognition service to ensure continuous listening.
      if (intendedListeningRef.current) {
        recognition.start();
      } else {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionError) => {
      console.error('Speech recognition error:', event.error);
      // On a critical error like 'not-allowed', stop trying to listen.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        intendedListeningRef.current = false;
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      
      const matchedPhrase = phrases.find(phrase => transcript.includes(phrase.toLowerCase()));

      if (matchedPhrase) {
        onMatch(matchedPhrase);
      }
    };

    recognition.start();
  }, [phrases, onMatch, lang]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intendedListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);
  
  return {
    isListening,
    startListening,
    stopListening,
    isSupported,
  };
};

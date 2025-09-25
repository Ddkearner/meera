'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// This function now checks if `window` exists before accessing it.
const isSpeechRecognitionSupported = (): boolean =>
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for support on mount (client-side only)
    const supported = isSpeechRecognitionSupported();
    setBrowserSupportsSpeechRecognition(supported);

    if (!supported) {
      console.warn('Speech recognition not supported by this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      // The 'no-speech' error is a normal event when the user is silent.
      // We can safely ignore it to prevent cluttering the console.
      if (event.error === 'no-speech') {
        return;
      }
      
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        // You could show a toast or message to the user here
        // to guide them to enable microphone permissions.
      }
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = 0; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        recognitionRef.current.start();
      } catch (error) {
        // This error can happen in some browsers if start() is called too frequently.
        // The `!isListening` guard should prevent most cases, but we log it just in case.
        console.error("Couldn't start listening:", error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Couldn't stop listening:", error)
      }
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
  };
};

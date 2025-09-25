'use client';
import { useState, useEffect, useRef } from 'react';

export function useTypewriter(initialText: string = '', speed: number = 20) {
  const [typewriterText, setTypewriterText] = useState(initialText);
  const [isTyping, setIsTyping] = useState(false);
  const fullTextRef = useRef('');
  const indexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTypewriter = (text: string) => {
    fullTextRef.current = text;
    setTypewriterText('');
    indexRef.current = 0;
    setIsTyping(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (indexRef.current < fullTextRef.current.length) {
        // Use substring for more efficient string updates
        setTypewriterText(fullTextRef.current.substring(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setIsTyping(false);
      }
    }, speed);
  };

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { typewriterText, startTypewriter, isTyping };
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useTypewriter(onEnd?: (finalText: string) => void) {
  const [typedResponse, setTypedResponse] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndCallbackRef = useRef(onEnd);

  // Keep the callback ref updated
  useEffect(() => {
    onEndCallbackRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playAudio = useCallback((audioSrc: string) => {
    if (!audioSrc || !audioRef.current) return;
    try {
      if (audioRef.current) {
        audioRef.current.src = audioSrc;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    } catch (error) {
      console.error("TTS playback failed", error);
    }
  }, []);

  const stopTypewriter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
     if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
    }
    setTypedResponse('');
  }, []);

  const startTypewriter = useCallback((text: string, audioSrc?: string) => {
    if (!text) return;
    
    stopTypewriter();
    setTypedResponse('');
    if (audioSrc) {
      playAudio(audioSrc); // Start audio playback immediately
    }

    let i = 0;
    const type = () => {
      if (i < text.length) {
        setTypedResponse(prev => prev + text.charAt(i));
        i++;
        timeoutRef.current = setTimeout(type, 50); // Adjust speed of typing here
      } else {
        if (onEndCallbackRef.current) {
          onEndCallbackRef.current(text);
        }
      }
    };
    type();
  }, [playAudio, stopTypewriter]);

  return { typedResponse, startTypewriter, stopTypewriter };
}

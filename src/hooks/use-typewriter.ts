'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { runTextToSpeech } from '@/lib/actions';

export function useTypewriter() {
  const [typedResponse, setTypedResponse] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

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

  const playAudio = useCallback(async (text: string) => {
    if (!text || !audioRef.current) return;
    try {
      const audioResponse = await runTextToSpeech(text);
      if (audioResponse?.media) {
        audioRef.current.src = audioResponse.media;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    } catch (error) {
      console.error("TTS request failed", error);
    }
  }, []);

  const startTypewriter = useCallback((text: string, onEnd?: () => void) => {
    if (!text) return;
    
    setTypedResponse('');
    onEndCallbackRef.current = onEnd || null;

    playAudio(text);

    let i = 0;
    const type = () => {
      if (i < text.length) {
        setTypedResponse(prev => prev + text.charAt(i));
        i++;
        timeoutRef.current = setTimeout(type, 50); // Adjust speed of typing here
      } else {
        if (onEndCallbackRef.current) {
          onEndCallbackRef.current();
        }
      }
    };
    type();
  }, [playAudio]);

  const stopTypewriter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
     if (audioRef.current) {
        audioRef.current.pause();
    }
    setTypedResponse('');
    onEndCallbackRef.current = null;
  }, []);

  return { typedResponse, startTypewriter, stopTypewriter };
}

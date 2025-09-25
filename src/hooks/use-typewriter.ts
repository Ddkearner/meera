'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { runTextToSpeech } from '@/lib/actions';

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

  const playAudio = useCallback(async (text: string) => {
    if (!text || !audioRef.current) return;
    try {
      const audioResponse = await runTextToSpeech(text);
      if (audioResponse?.media && audioRef.current) {
        audioRef.current.src = audioResponse.media;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    } catch (error) {
      console.error("TTS request failed", error);
    }
  }, []);

  const startTypewriter = useCallback((text: string) => {
    if (!text) return;
    
    stopTypewriter();
    setTypedResponse('');
    playAudio(text); // Start audio generation and playback immediately

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

  const stopTypewriter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
     if (audioRef.current) {
        audioRef.current.pause();
        // By setting src to '', we ensure that the audio stops immediately
        // and doesn't continue playing the buffered content.
        audioRef.current.src = '';
    }
    setTypedResponse('');
  }, []);

  return { typedResponse, startTypewriter, stopTypewriter };
}

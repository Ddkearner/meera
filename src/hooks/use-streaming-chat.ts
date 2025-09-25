'use client';

import { useState, useRef, useCallback } from 'react';
import { runChatFlow, runTextToSpeech } from '@/lib/actions';
import type { StreamingChatInput } from '@/lib/types';
import { useToast } from './use-toast';

interface UseStreamingChatProps {
  onStreamEnd?: (finalText: string) => void;
  onStreamError?: (error: Error) => void;
}

export function useStreamingChat({ onStreamEnd, onStreamError }: UseStreamingChatProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false); // To control mic state from this hook
  const [streamingResponse, setStreamingResponse] = useState('');
  const { toast } = useToast();
  const audioQueue = useRef<string[]>([]);
  const isPlayingAudio = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (typeof window !== 'undefined' && !audioRef.current) {
    audioRef.current = new Audio();
  }

  const playNextAudio = useCallback(async () => {
    if (isPlayingAudio.current || audioQueue.current.length === 0) {
      return;
    }

    isPlayingAudio.current = true;
    const textToPlay = audioQueue.current.shift();

    if (textToPlay && audioRef.current) {
      try {
        const audioResponse = await runTextToSpeech(textToPlay);
        if (audioResponse?.media) {
          audioRef.current.src = audioResponse.media;
          
          // Ensure the previous audio is finished before playing the new one
          await new Promise<void>((resolve) => {
            if (audioRef.current?.paused) {
              resolve();
            } else {
              audioRef.current?.addEventListener('ended', () => resolve(), { once: true });
            }
          });
          
          await audioRef.current.play();
          audioRef.current.onended = () => {
            isPlayingAudio.current = false;
            playNextAudio();
          };
        } else {
          isPlayingAudio.current = false;
          playNextAudio();
        }
      } catch (error) {
        console.error("Audio play failed", error);
        isPlayingAudio.current = false;
        playNextAudio();
      }
    } else {
      isPlayingAudio.current = false;
    }
  }, []);

  const processTextForAudio = useCallback((text: string) => {
    // Simple sentence-based chunking.
    const sentences = text.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);
    sentences.forEach(sentence => audioQueue.current.push(sentence));
    if (!isPlayingAudio.current) {
      playNextAudio();
    }
  }, [playNextAudio]);

  const startStream = useCallback(async (input: StreamingChatInput) => {
    setIsLoading(true);
    setStreamingResponse('');
    audioQueue.current = [];
    isPlayingAudio.current = false;

    try {
      let accumulatedText = '';
      await runChatFlow(input, (chunk: string) => {
        accumulatedText += chunk;
        setStreamingResponse(prev => prev + chunk);
        processTextForAudio(chunk);
      });

      // Wait for the last audio chunk to finish
      const checkAudio = setInterval(() => {
        if (!isPlayingAudio.current && audioQueue.current.length === 0) {
          clearInterval(checkAudio);
          setIsLoading(false);
          onStreamEnd?.(accumulatedText);
        }
      }, 100);

    } catch (error) {
      console.error('Error during chat stream:', error);
      setIsLoading(false);
      onStreamError?.(error as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
      });
    }
  }, [onStreamEnd, onStreamError, processTextForAudio, toast]);

  const stopStream = useCallback(() => {
    // This is a placeholder. In a true HTTP stream, you would abort the fetch request.
    // For this Server Action-based stream, we can only stop the client-side effects.
    setIsLoading(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioQueue.current = [];
    isPlayingAudio.current = false;
  }, []);

  return {
    startStream,
    stopStream,
    isLoading,
    streamingResponse,
    isListening,
    setIsListening,
  };
}

'use client';

import { useState, useRef, useCallback } from 'react';
import { runChatFlow, runTextToSpeech } from '@/lib/actions';
import type { StreamingChatInput } from '@/lib/types';
import { useToast } from './use-toast';
import { readStreamableValue } from 'ai/rsc';

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
          
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Audio play failed", error);
              isPlayingAudio.current = false;
              playNextAudio(); // Try next in queue
            });
          }

          audioRef.current.onended = () => {
            isPlayingAudio.current = false;
            playNextAudio();
          };
        } else {
          isPlayingAudio.current = false;
          playNextAudio();
        }
      } catch (error) {
        console.error("TTS request failed", error);
        isPlayingAudio.current = false;
        playNextAudio();
      }
    } else {
      isPlayingAudio.current = false;
    }
  }, []);

  const processTextForAudio = useCallback((text: string) => {
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
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    try {
      const { stream } = await runChatFlow(input);
      
      let accumulatedText = '';
      for await (const chunk of readStreamableValue(stream)) {
        if (chunk) {
          accumulatedText += chunk;
          setStreamingResponse(prev => prev + chunk);
          processTextForAudio(chunk);
        }
      }

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

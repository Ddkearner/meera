'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { VoiceOrb } from '@/components/voice-orb';
import { useStreamingChat } from '@/hooks/use-streaming-chat';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finalTranscriptRef = useRef('');

  const {
    startStream,
    stopStream,
    isLoading,
    isListening,
    setIsListening,
    streamingResponse,
    clearStreamingResponse,
  } = useStreamingChat({
    onStreamEnd: (finalText: string) => {
      setMessages(prev => [
        ...prev,
        { role: 'model', content: finalText },
      ]);
      // Re-enable listening after Meera finishes speaking.
      if (recognitionRef.current && !isListening) {
        startListening();
      }
    },
    onStreamError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
      });
      // Re-enable listening after an error.
      if (recognitionRef.current && !isListening) {
        startListening();
      }
    },
  });

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      finalTranscriptRef.current = transcript;
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [transcript, setIsListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [setIsListening]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart listening if it wasn't stopped manually
        if (recognitionRef.current && !finalTranscriptRef.current) {
          // A brief delay to prevent rapid-fire restarts
          setTimeout(() => startListening(), 100);
        }
      };
      
      recognition.onerror = event => {
        if (['aborted', 'no-speech', 'network'].includes(event.error)) {
          return;
        }
        if (event.error === 'not-allowed') {
          setMicError("Microphone access denied. Please enable it in your browser settings to use voice input.");
        } else {
           console.error('Speech recognition error:', event.error);
        }
        setIsListening(false);
      };

      recognition.onresult = event => {
        let interimTranscript = '';
        finalTranscriptRef.current = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscriptRef.current + interimTranscript);
      };
      
      recognitionRef.current = recognition;
      startListening();
    } else {
      setMicError('Speech recognition is not supported in your browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (values: { message: string }) => {
    const messageText = values.message.trim();
    if (!messageText) return;

    if (isListening) {
      stopListening();
    }
    
    const userMessage: ChatMessage = { role: 'user', content: messageText };
    const newMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(newMessages);

    setTranscript('');
    finalTranscriptRef.current = '';
    clearStreamingResponse();

    const historyForAI = newMessages
      .filter(msg => msg.content.trim() !== '') // Exclude empty messages
      .map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }],
      }));

    startStream({
      history: historyForAI,
      message: messageText,
    });
  };

  const isTranscribing = isListening && transcript.length > 0;
  
  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center text-center p-4">
      <VoiceOrb isListening={isListening} className="h-24 w-24" />
      {micError && (
        <div className="mt-8 max-w-md rounded-md bg-destructive/10 p-4 text-center text-destructive">
          <h2 className="font-semibold">Microphone Error</h2>
          <p className="text-sm">{micError}</p>
          <button onClick={startListening} className="mt-2 text-sm font-semibold underline">
            Try Again
          </button>
        </div>
      )}
       {!isListening && !transcript && !micError && (
         <h2 className="mt-8 text-2xl font-semibold text-gray-700">How can I help you today?</h2>
       )}
        <p className="mt-4 max-w-xl text-center text-lg text-muted-foreground min-h-[56px]">
          {/* This space is intentionally left for the main input to handle transcript display */}
        </p>
    </div>
  );
  
  const displayMessages = useMemo(() => {
    const allMessages = [...messages];
    if (isLoading && streamingResponse) {
      allMessages.push({ role: 'model', content: streamingResponse });
    }
    return allMessages;
  }, [messages, isLoading, streamingResponse]);


  return (
    <div className="flex h-screen flex-col bg-background">
       <ChatHeader isListening={isTranscribing && displayMessages.length > 0} />
      <main className="flex-1 overflow-y-auto">
         {displayMessages.length === 0 && !isLoading ? (
           <WelcomeScreen />
        ) : (
          <ChatMessages messages={displayMessages} isLoading={isLoading && !streamingResponse} />
        )}
      </main>
      <ChatInput
        onSubmit={handleSendMessage}
        isLoading={isLoading}
        value={transcript}
        onValueChange={setTranscript}
        isListening={isListening}
        onMicrophoneClick={isListening ? stopListening : startListening}
      />
    </div>
  );
}

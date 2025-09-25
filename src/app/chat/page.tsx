'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import { runChatFlow, runTextToSpeech } from '@/lib/actions';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { VoiceOrb } from '@/components/voice-orb';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMounted = useRef(false);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        if ((error as DOMException).name !== 'InvalidStateError') {
          console.error("Speech recognition could not start:", error);
        }
      }
    }
  }, [isListening]);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);
  
  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    if (typeof window === 'undefined') return;
    
    if (!audioRef.current) {
        audioRef.current = new Audio();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = event => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = event => {
        if (event.error === 'aborted' || event.error === 'no-speech' || event.error === 'network') {
          return;
        }
        if (event.error === 'not-allowed') {
          setMicError("Microphone access denied. Please enable it in your browser settings to use voice input.");
        } else {
           console.error('Speech recognition error:', event.error);
        }
        setIsListening(false);
      };
      
      recognition.onstart = () => {
          setIsListening(true);
          setMicError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Do not automatically restart here to prevent loops.
        // The user can restart by clicking the orb.
      };
      
      recognitionRef.current = recognition;
      startListening();
    } else {
       setMicError("Speech recognition is not supported in your browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (values: { message: string }) => {
    const messageText = values.message.trim();
    if (!messageText) return;

    // Manually stop listening before sending message
    if (isListening) {
      stopListening();
    }

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setTranscript('');

    try {
      const historyForAI = [...messages, userMessage].slice(0, -1).map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }],
      }));

      const response = await runChatFlow({
        history: historyForAI,
        message: messageText,
      });

      const modelMessage: ChatMessage = {
        role: 'model',
        content: response.response,
      };
      setMessages(prev => [...prev, modelMessage]);

      const audioResponse = await runTextToSpeech(response.response);
      if (audioResponse?.media && audioRef.current) {
          audioRef.current.src = audioResponse.media;
          audioRef.current.play();
          // Dont automatically start listening after TTS
      }
    } catch (error) {
      console.error('Error calling AI flow:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center text-center p-4">
      <VoiceOrb isListening={isListening} />
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

  const isTranscribing = isListening && transcript.length > 0 && messages.length > 0;

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader isListening={isTranscribing} />
      <main className="flex-1 overflow-y-auto">
         {messages.length === 0 && !isLoading ? (
           <WelcomeScreen />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
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

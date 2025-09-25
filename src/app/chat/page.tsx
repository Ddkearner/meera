'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { VoiceOrb } from '@/components/voice-orb';
import { runChatFlow } from '@/lib/actions';
import { useTypewriter } from '@/hooks/use-typewriter';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const [isListening, setIsListening] = useState(false);

  const { typedResponse, startTypewriter, stopTypewriter } = useTypewriter();

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      finalTranscriptRef.current = transcript;
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [transcript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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
        if (recognitionRef.current && !finalTranscriptRef.current && !isLoading) {
          setTimeout(() => startListening(), 100);
        }
      };

      recognition.onerror = event => {
        if (['aborted', 'no-speech', 'network'].includes(event.error)) {
          return;
        }
        if (event.error === 'not-allowed') {
          setMicError("Microphone access denied. Please enable it in your browser settings to use voice input.");
        }
        setIsListening(false);
      };

      recognition.onresult = event => {
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        finalTranscriptRef.current = finalTranscript;
        setTranscript(finalTranscript + interimTranscript);
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
      stopTypewriter();
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
    setMessages(prev => [...prev, userMessage]);
    setTranscript('');
    finalTranscriptRef.current = '';
    setIsLoading(true);
    stopTypewriter();

    try {
      const historyForAI = [...messages, userMessage]
        .filter(msg => msg.content.trim() !== '')
        .map(msg => ({
          role: msg.role as 'user' | 'model',
          content: [{ text: msg.content }],
        }));

      const response = await runChatFlow({
        history: historyForAI,
        message: messageText,
      });

      setIsLoading(false);

      if (response && response.response) {
        startTypewriter(response.response, () => {
          const finalMessage: ChatMessage = { role: 'model', content: response.response };
          setMessages(prev => [...prev, finalMessage]);
          if (recognitionRef.current && !isListening) {
            startListening();
          }
        });
      } else {
        throw new Error("No response from AI");
      }

    } catch (error) {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
      });
       if (recognitionRef.current && !isListening) {
        startListening();
      }
    }
  };

  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center text-center p-4">
      <VoiceOrb isListening={isListening} className="h-32 w-32" />
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader isListening={isListening && messages.length > 0} />
      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isLoading && !typedResponse ? (
          <WelcomeScreen />
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            streamingResponse={typedResponse}
          />
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

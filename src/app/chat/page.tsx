'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { VoiceOrb } from '@/components/voice-orb';
import { runChatFlow, runTextToSpeech } from '@/lib/actions';
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

  const { typedResponse, startTypewriter, stopTypewriter } = useTypewriter(
    (finalText) => {
      // Update the last message with the final content when the typewriter finishes.
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model') {
          newMessages[newMessages.length - 1].content = finalText;
        }
        return newMessages;
      });

      if (recognitionRef.current && !isListening) {
        startListening();
      }
    }
  );

  useEffect(() => {
    // This effect updates the content of the last message as the typewriter types.
    if (typedResponse) {
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model') {
          newMessages[newMessages.length - 1].content = typedResponse;
        }
        return newMessages;
      });
    }
  }, [typedResponse]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      finalTranscriptRef.current = transcript;
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [transcript, isListening]);

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
    // Add user message and an empty placeholder for the AI response
    setMessages(prev => [...prev, userMessage, { role: 'model', content: '' }]);
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

      if (!response || !response.response) {
        throw new Error("No response from AI");
      }
      
      const audioResponse = await runTextToSpeech(response.response);
      
      setIsLoading(false);

      if (audioResponse?.media) {
         startTypewriter(response.response, audioResponse.media);
      } else {
        startTypewriter(response.response);
      }

    } catch (error) {
      setIsLoading(false);
       // Remove the empty model message placeholder on error
      setMessages(prev => prev.slice(0, prev.length -1));
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
        {messages.length === 0 && !isLoading ? (
          <WelcomeScreen />
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
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

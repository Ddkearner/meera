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
  const [isListening, setIsListening] = useState(true); // Start listening by default
  const [transcript, setTranscript] = useState('');
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const handleSendMessage = async (values: { message: string }) => {
    if (!values.message.trim()) return;

    // Stop listening when a message is sent
    stopListening();

    const userMessage: ChatMessage = { role: 'user', content: values.message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setTranscript('');

    try {
      const historyForAI = newMessages.slice(0, -1).map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }],
      }));

      // Get text response from Meera
      const response = await runChatFlow({
        history: historyForAI,
        message: values.message,
      });

      const modelMessage: ChatMessage = {
        role: 'model',
        content: response.response,
      };
      setMessages(prev => [...prev, modelMessage]);

      // Get audio for the response
      const audioResponse = await runTextToSpeech(response.response);
      if (audioResponse?.media) {
        const audio = new Audio(audioResponse.media);
        audio.play();
      }
    } catch (error) {
      console.error('Error calling AI flow:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = event => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscript(finalTranscript + interimTranscript);
        };

        recognition.onerror = event => {
          if (event.error === 'aborted' || event.error === 'no-speech') {
            console.log(`Speech recognition stopped: ${event.error}`);
            return;
          }
          console.error('Speech recognition error:', event.error);
          toast({
            variant: 'destructive',
            title: 'Recognition Error',
            description: 'Could not understand audio. Please try again.',
          });
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
        startListening(); // Start listening on initial mount
      }
    }

    return () => {
      stopListening();
    };
  }, [startListening, stopListening, toast]);
  
  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <VoiceOrb transcript={transcript} isListening={isListening} />
      <h2 className="mt-8 text-2xl font-semibold text-gray-700">How can I help you today?</h2>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader />
      <main className="flex-1 overflow-y-auto" onClick={!isListening ? startListening : undefined}>
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
      />
    </div>
  );
}

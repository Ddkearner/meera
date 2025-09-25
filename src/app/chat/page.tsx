'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import { runChatFlow, runTextToSpeech } from '@/lib/actions';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { MeeraAvatar } from '@/components/meera-avatar';
import { VoiceOrb } from '@/components/voice-orb';
import { Mic } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { toast } = useToast();

  const recognition =
    typeof window !== 'undefined'
      ? new (window.SpeechRecognition || window.webkitSpeechRecognition)()
      : null;

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  const handleSendMessage = async (values: { message: string }) => {
    if (!values.message.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: values.message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

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

  const startListening = () => {
    if (recognition && !isListening) {
      setTranscript('');
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
        console.error('Speech recognition error:', event.error);
        toast({
          variant: 'destructive',
          title: 'Recognition Error',
          description: 'Could not understand audio. Please try again.',
        });
        stopListening();
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
           handleSendMessage({ message: transcript });
           setTranscript('');
        }
      };

      recognition.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);
  
  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4">
        <MeeraAvatar className="h-12 w-12" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700">How can I help you today?</h2>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader />
      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isLoading && !isListening ? (
           <WelcomeScreen />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
        {isListening && <VoiceOrb transcript={transcript} />}
      </main>
      <ChatInput
        onSubmit={handleSendMessage}
        isLoading={isLoading}
        isListening={isListening}
        onListenClick={isListening ? stopListening : startListening}
        micIcon={<Mic />}
        value={transcript}
        onValueChange={setTranscript}
      />
    </div>
  );
}
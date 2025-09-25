'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { runChatFlow, runTtsFlow } from '@/lib/actions';
import { useTypewriter } from '@/hooks/use-typewriter';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

const CHAT_STORAGE_KEY = 'meera-chat-history';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { typewriterText, startTypewriter, isTyping } = useTypewriter('');
  const [inputValue, setInputValue] = useState('');
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Load messages from localStorage on initial render
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Failed to load messages from localStorage', error);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    // We don't save if there are no messages to avoid storing an empty array
    if (messages.length > 0) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save messages to localStorage', error);
      }
    }
  }, [messages]);


  useEffect(() => {
    if (browserSupportsSpeechRecognition && !isListening) {
      startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    // This effect updates the content of the last message as the typewriter runs.
    if (isTyping || typewriterText) {
      setMessages(prev => {
        // If there are no messages or the last one isn't a model message, do nothing.
        if (prev.length === 0 || prev[prev.length - 1].role !== 'model') {
          return prev;
        }
        
        // Create a new array and update the content of the last message.
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = typewriterText;
        return newMessages;
      });
    }
  }, [typewriterText, isTyping]);
  

  const handleSendMessage = async (values: { message: string }) => {
    const messageText = values.message.trim();
    if (!messageText) return;

    if (audio) {
      audio.pause();
      setAudio(null);
    }

    if (isListening) {
      stopListening();
    }

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const historyForAI = [...messages, userMessage].map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }],
      }));
      
      // 1. Get the text response from the AI first
      const response = await runChatFlow({
        history: historyForAI,
        message: messageText,
      });

      if (response.response) {
        // 2. Generate the audio from the response text.
        // The user still sees the loading indicator.
        const audioResult = await runTtsFlow(response.response);

        // 3. Once audio is ready, stop loading and add the empty message container.
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'model', content: '' }]);

        // 4. Play audio and start the typewriter SIMULTANEOUSLY.
        if ('audio' in audioResult && audioResult.audio) {
          const newAudio = new Audio(audioResult.audio);
          newAudio.onended = () => setAudio(null);
          setAudio(newAudio);
          newAudio.play();
        } else {
          console.error(audioResult.error || 'Failed to get audio.');
        }

        startTypewriter(response.response);

      } else {
        throw new Error('No valid response from AI');
      }
    } catch (error) {
      console.error('Error getting response:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
      });
      // Revert message update on error by removing the last user message
      setMessages(prev => prev.slice(0, -1));
      setIsLoading(false);
    } finally {
      if (browserSupportsSpeechRecognition) {
        const restartTimeout = setTimeout(() => {
          if (!isListening) {
            startListening();
          }
        }, 500);
        return () => clearTimeout(restartTimeout);
      }
    }
  };

  const handleVoiceToggle = () => {
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center text-center p-4 animate-message-in">
      <div className="relative h-48 w-48">
        <div className="absolute inset-0 meera-gradient rounded-full filter blur-2xl opacity-50 animate-pulse-medium"></div>
        <div className="absolute inset-4 meera-gradient rounded-full filter blur-xl opacity-60 animate-pulse-slow"></div>
        <div className="absolute inset-8 meera-gradient rounded-full filter blur-lg opacity-70 animate-pulse"></div>
      </div>
      <h2 className="mt-8 text-2xl font-semibold text-gray-700 dark:text-gray-300">
        How can I help you today?
      </h2>
    </div>
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <ChatHeader isListening={isListening} />
      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isLoading ? (
          <WelcomeScreen />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </main>
      <ChatInput
        onSubmit={handleSendMessage}
        isLoading={isLoading || isTyping}
        isListening={isListening}
        onVoiceToggle={handleVoiceToggle}
        browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
        inputValue={inputValue}
        setInputValue={setInputValue}
      />
    </div>
  );
}

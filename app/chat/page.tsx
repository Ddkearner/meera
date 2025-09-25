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
  const audioPromiseRef = useRef<Promise<any> | null>(null);

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
    if (isTyping || typewriterText) {
      setMessages(prev => {
        if (prev.length === 0 || prev[prev.length - 1].role !== 'model') {
          // This handles the case where a new model message needs to be added
          if (isTyping && prev[prev.length - 1]?.role === 'user') {
            return [...prev, { role: 'model', content: typewriterText }];
          }
          return prev;
        }
        
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
    
        if (lastMessage) {
          lastMessage.content = typewriterText;
          return newMessages;
        }
        return prev;
      });
    }
  }, [typewriterText, isTyping]);
  
  useEffect(() => {
    const playAudioWhenReady = async () => {
      if (!isTyping && typewriterText && audioPromiseRef.current) {
        try {
          const result = await audioPromiseRef.current;
          if ('audio' in result && result.audio) {
            const newAudio = new Audio(result.audio);
            setAudio(newAudio);
            newAudio.play();
          } else {
            console.error(result.error || 'Failed to get audio.');
          }
        } catch (error) {
          console.error('Error playing TTS audio:', error);
        } finally {
          audioPromiseRef.current = null;
        }
      }
    };
    playAudioWhenReady();
  }, [isTyping, typewriterText]);

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
      // We pass the new user message in the history immediately
      const historyForAI = [...messages, userMessage].map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }],
      }));
      
      const response = await runChatFlow({
        // Pass the updated history
        history: historyForAI,
        message: messageText,
      });

      setIsLoading(false);

      if (response.response) {
        // This will be handled by the typewriter effect now.
        
        // Start TTS generation immediately in the background
        audioPromiseRef.current = runTtsFlow(response.response);

        // Start typewriter effect, which will also add the message container
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
      // Revert message update on error
      setMessages(prev => prev.filter(msg => msg.content !== userMessage.content));
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

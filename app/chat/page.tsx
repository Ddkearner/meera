'use client';

import { useState, useEffect } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { runChatFlow } from '@/lib/actions';
import { useTypewriter } from '@/hooks/use-typewriter';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { typewriterText, startTypewriter, isTyping } = useTypewriter('');

  useEffect(() => {
    if (typewriterText) {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'model') {
          lastMessage.content = typewriterText;
          return newMessages;
        }
        return prev;
      });
    }
  }, [typewriterText]);

  const handleSendMessage = async (values: { message: string }) => {
    const messageText = values.message.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    const newMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const historyForAI = newMessages.slice(0, -1).map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }],
      }));

      const response = await runChatFlow({
        history: historyForAI,
        message: messageText,
      });

      if (!response || !response.response) {
        throw new Error('No valid response from AI');
      }

      const modelMessage: ChatMessage = {
        role: 'model',
        content: '',
      };
      setMessages(prev => [...prev, modelMessage]);
      startTypewriter(response.response);

    } catch (error) {
      console.error('Error getting response:', error);
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
    <div className="flex h-full flex-col items-center justify-center text-center p-4 animate-message-in">
      <div className="h-32 w-32">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#87d7ff', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#ff8da6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#b1ff91', stopOpacity: 1 }} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="50" cy="50" r="45" fill="url(#grad1)" filter="url(#glow)" />
        </svg>
      </div>
      <h2 className="mt-8 text-2xl font-semibold text-gray-700">How can I help you today?</h2>
    </div>
  );


  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader isListening={false} />
      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isLoading ? (
          <WelcomeScreen />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading && !isTyping} />
        )}
      </main>
      <ChatInput
        onSubmit={handleSendMessage}
        isLoading={isLoading || isTyping}
      />
    </div>
  );
}

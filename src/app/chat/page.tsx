'use client';

import { useState } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import { runChatFlow } from '@/lib/actions';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { MeeraAvatar } from '@/components/meera-avatar';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (values: { message: string }) => {
    const userMessage: ChatMessage = { role: 'user', content: values.message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const historyForAI = newMessages.slice(0, -1).map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }],
      }));

      const response = await runChatFlow({
        history: historyForAI,
        message: values.message,
      });

      const modelMessage: ChatMessage = {
        role: 'model',
        content: response.response,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error calling AI flow:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response from Meera. Please try again.',
      });
       setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
  
  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="relative mb-4">
        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 opacity-20 blur-2xl"></div>
        <MeeraAvatar className="h-16 w-16" />
      </div>
      <h2 className="text-2xl font-semibold">How can I help you today?</h2>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader />
      <main className="flex-1 overflow-hidden">
        {messages.length === 0 && !isLoading ? (
           <WelcomeScreen />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </main>
      <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}

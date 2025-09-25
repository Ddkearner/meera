'use client';

import { useState, useEffect } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { runChatFlow } from '@/lib/actions';
import { useTypewriter } from '@/hooks/use-typewriter';
import { Button } from '@/components/ui/button';
import { Check, AppWindow, MessageCircle } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const { typewriterText, startTypewriter, isTyping } = useTypewriter('');

  useEffect(() => {
    // This effect updates the last message with the typewriter text
    if (isTyping || typewriterText) {
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
  }, [typewriterText, isTyping]);

  const handleSendMessage = async (values: { message: string }) => {
    const messageText = values.message.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const historyForAI = messages.map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }],
      }));

      const response = await runChatFlow({
        history: historyForAI,
        message: messageText,
      });

      setIsLoading(false);

      if (response.response) {
        const modelMessage: ChatMessage = { role: 'model', content: '' };
        setMessages(prev => [...prev, modelMessage]);
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
      setMessages(prev => prev.filter(msg => msg !== userMessage));
      setIsLoading(false);
    }
  };

  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center text-center p-4 animate-message-in">
      <div className="relative h-48 w-48">
        <div className="absolute inset-0 meera-gradient rounded-full filter blur-2xl opacity-50 animate-pulse-medium"></div>
        <div className="absolute inset-4 meera-gradient rounded-full filter blur-xl opacity-60 animate-pulse-slow"></div>
        <div className="absolute inset-8 meera-gradient rounded-full filter blur-lg opacity-70 animate-pulse"></div>
      </div>
      <h2 className="mt-8 text-2xl font-semibold text-gray-700 dark:text-gray-300">How can I help you today?</h2>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader isListening={isListening} />
      <main className="flex-1 overflow-y-auto relative">
        {messages.length === 0 && !isLoading ? (
          <WelcomeScreen />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}

        <div className="absolute top-6 right-6">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg">
            <Check className="mr-2 h-4 w-4" />
            To-Do Widget
          </Button>
        </div>
        
        <div className="absolute bottom-6 right-6 flex flex-col gap-3">
           <Button size="icon" className="rounded-full h-12 w-12 bg-card text-foreground shadow-md hover:bg-card/90">
             <AppWindow className="h-6 w-6" />
           </Button>
           <Button size="icon" className="rounded-full h-12 w-12 bg-card text-foreground shadow-md hover:bg-card/90">
             <MessageCircle className="h-6 w-6" />
           </Button>
        </div>

      </main>
      <ChatInput
        onSubmit={handleSendMessage}
        isLoading={isLoading || isTyping}
      />
    </div>
  );
}

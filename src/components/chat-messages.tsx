'use client';
import { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { ChatMessage } from './chat-message';
import { MeeraAvatar } from './meera-avatar';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

export function ChatMessages({
  messages,
  isLoading,
}: ChatMessagesProps) {
  const scrollableContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);

  const handleScroll = () => {
    const container = scrollableContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isAtBottom.current = scrollHeight - scrollTop - clientHeight < 10;
    }
  };

  useEffect(() => {
    const container = scrollableContainerRef.current;
    if (container && isAtBottom.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const container = scrollableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div
      ref={scrollableContainerRef}
      className="flex-1 overflow-y-auto p-4 md:p-6"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isLoading && (
          <div className="group relative flex items-start gap-4">
            <MeeraAvatar className="h-8 w-8" />
            <div className="flex items-center space-x-2 rounded-lg bg-card p-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:0s]"></span>
                <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

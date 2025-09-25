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

  useEffect(() => {
    const container = scrollableContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading]);

  const lastMessage = messages[messages.length - 1];
  const showLoading = isLoading && (!lastMessage || lastMessage.role !== 'model' || lastMessage.content === '');

  return (
    <div
      ref={scrollableContainerRef}
      className="h-full overflow-y-auto p-4 md:p-6"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {showLoading && (
          <div className="group relative flex items-start gap-4 animate-message-in">
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

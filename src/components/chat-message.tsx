import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MeeraAvatar } from './meera-avatar';
import { UserAvatar } from './user-avatar';
import { Prose } from '@/components/prose';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUserModel = message.role === 'model';
  return (
    <div
      className={cn('group relative flex items-start animate-message-in gap-4')}
    >
      {isUserModel ? <MeeraAvatar className="h-8 w-8" /> : <UserAvatar />}
      <div
        className={cn(
          'relative flex max-w-[90%] flex-col gap-1 text-sm md:max-w-[85%]',
          {
            'meera-message-container': isUserModel,
            'rounded-lg bg-secondary p-4': !isUserModel,
          }
        )}
      >
        <div className={cn('relative z-10 rounded-lg bg-card p-4', { 'bg-white': isUserModel })}>
            <Prose
            className={cn('break-words')}
            >
            {message.content}
            </Prose>
        </div>
      </div>
    </div>
  );
}

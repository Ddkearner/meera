import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MeeraAvatar } from './meera-avatar';
import { Avatar } from '@/components/ui/avatar';
import { Prose } from '@/components/prose';

export function UserAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/80 text-primary-foreground',
        className
      )}
    >
      <span className="font-semibold text-sm">Y</span>
    </div>
  );
}

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
        className={cn('flex max-w-[90%] flex-col gap-1 text-sm md:max-w-[85%]', {
          'meera-gradient rounded-lg p-4 text-white': isUserModel,
        })}
      >
        <Prose
          className={cn('break-words', {
            'prose-invert': isUserModel,
          })}
        >
          {message.content}
        </Prose>
      </div>
    </div>
  );
}

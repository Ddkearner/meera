import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MeeraAvatar } from './meera-avatar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

export function UserAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
        className
      )}
    >
      <User className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}


interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUserModel = message.role === 'model';
  return (
    <div
      className={cn(
        'group relative flex items-start md:-ml-12 animate-message-in',
        isUserModel ? 'justify-start' : 'justify-end'
      )}
    >
      {isUserModel && (
        <MeeraAvatar className="mr-4 hidden h-8 w-8 md:flex" />
      )}
      <div
        className={cn(
          'flex max-w-[90%] flex-col gap-1 rounded-lg px-3 py-2 text-sm shadow-sm md:max-w-[75%]',
          isUserModel
            ? 'bg-card/50'
            : 'bg-primary text-primary-foreground'
        )}
      >
        <div className="prose prose-sm prose-p:leading-normal break-words text-foreground dark:prose-invert prose-p:text-foreground">
          {message.content}
        </div>
      </div>
      {!isUserModel && (
        <UserAvatar className="ml-4 hidden h-8 w-8 md:flex" />
      )}
    </div>
  );
}

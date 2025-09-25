import { cn } from '@/lib/utils';
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

import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function MeeraAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/70 to-accent/70"></div>
      <Sparkles className="relative h-5 w-5 text-primary-foreground" />
    </div>
  );
}

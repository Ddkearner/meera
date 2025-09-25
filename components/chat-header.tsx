import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export function ChatHeader({ isListening }: { isListening: boolean }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-16 w-full shrink-0 items-center border-b bg-background/80 px-4 backdrop-blur-sm transition-all duration-500',
        isListening && 'header-gradient'
      )}
    >
      <div className="flex items-center gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Meera AI</h1>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </header>
  );
}

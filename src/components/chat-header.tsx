import { UserNav } from './user-nav';
import { MeeraAvatar } from './meera-avatar';

export function ChatHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <MeeraAvatar className="h-8 w-8" />
        <h1 className="text-xl font-semibold tracking-tight">Meera AI</h1>
      </div>
      <UserNav />
    </header>
  );
}

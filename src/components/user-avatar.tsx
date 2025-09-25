import { cn } from '@/lib/utils';

export function UserAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary',
        className
      )}
    >
      {/* You can add user initials or an icon here */}
    </div>
  );
}

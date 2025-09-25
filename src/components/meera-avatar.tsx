import { cn } from '@/lib/utils';

export function MeeraAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full',
        className
      )}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#87d7ff', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#ff8da6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#b1ff91', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#grad1)" filter="url(#glow)" />
      </svg>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

/**
 * A component to render markdown content with prose styles.
 * It uses `@tailwindcss/typography` plugin.
 */
export function Prose({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'prose prose-neutral max-w-none dark:prose-invert',
        // Text
        'prose-p:text-foreground/80 prose-headings:text-foreground',
        'prose-strong:text-foreground prose-em:text-foreground',
        // Links
        'prose-a:text-primary prose-a:transition-colors hover:prose-a:text-primary/80',
        // Lists
        'prose-ul:text-foreground/80 prose-ol:text-foreground/80',
        className
      )}
      {...props}
    />
  );
}

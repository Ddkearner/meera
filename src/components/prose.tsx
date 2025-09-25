'use client';

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import type { HTMLAttributes } from 'react';

/**
 * A component to render markdown content with prose styles.
 * It uses `@tailwindcss/typography` plugin.
 */
export function Prose({
  children,
  className,
  ...props
}: { children: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'prose prose-neutral max-w-none dark:prose-invert',
        // Text
        'prose-p:text-foreground/80 prose-headings:text-foreground',
        'prose-strong:text-foreground prose-em:text-foreground',
        // Lists
        'prose-ul:text-foreground/80 prose-ol:text-foreground/80',
        'prose-li:my-1',
        'prose-bullets:text-muted-foreground',
        // Links
        'prose-a:text-primary prose-a:transition-colors hover:prose-a:text-primary/80',
        className
      )}
      {...props}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

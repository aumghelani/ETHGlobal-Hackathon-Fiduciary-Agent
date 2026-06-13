import * as React from 'react';
import { cn } from '@/lib/utils';

// Bento cell. Subtle elevation, generous rounding (token --radius). `interactive`
// adds a tactile hover lift for clickable cards.
export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded border border-line bg-surface shadow-sm',
        interactive && 'transition-all duration-200 hover:border-line-strong hover:shadow-md',
        className
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

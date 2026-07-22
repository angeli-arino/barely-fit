import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-1)]', className)} {...props} />;
}

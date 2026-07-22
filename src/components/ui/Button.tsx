import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  full?: boolean;
}

export function Button({ variant = 'secondary', size = 'md', icon, full, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border font-semibold transition active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-45',
        variant === 'primary' && 'border-transparent bg-[var(--accent)] text-[#141414] hover:bg-[var(--accent-hover)]',
        variant === 'secondary' && 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]',
        variant === 'ghost' && 'border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]',
        variant === 'danger' && 'border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_20%,transparent)]',
        size === 'sm' && 'min-h-10 px-3 text-sm',
        size === 'md' && 'px-4 text-sm',
        size === 'lg' && 'min-h-14 px-5 text-base',
        full && 'w-full',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

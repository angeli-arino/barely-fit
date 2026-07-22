import type { InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: ReactNode;
  error?: string;
}

export function FormField({ label, suffix, error, className, ...props }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[.12em] text-[var(--text-muted)]">{label}</span>
      <span className={clsx('flex min-h-12 items-center rounded-[var(--radius-md)] border bg-[var(--bg-elevated)] px-3 transition focus-within:border-[var(--accent)]', error ? 'border-[var(--danger)]' : 'border-[var(--border)]')}>
        <input className={clsx('min-w-0 flex-1 bg-transparent text-base text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]', className)} {...props} />
        {suffix && <span className="ml-2 text-sm font-semibold text-[var(--text-muted)]">{suffix}</span>}
      </span>
      {error && <span className="mt-1.5 block text-sm text-[var(--danger)]">{error}</span>}
    </label>
  );
}

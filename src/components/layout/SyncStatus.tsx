import { Check, Cloud, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react';
import { clsx } from 'clsx';
import type { SyncState } from '../../types';

const copy: Record<SyncState, string> = {
  online: 'Online',
  offline: 'Offline · saving locally',
  syncing: 'Syncing',
  synced: 'Saved',
  error: 'Sync needs retry · logging safe',
};

export function SyncStatus({ state, compact = false }: { state: SyncState; compact?: boolean }) {
  const Icon = state === 'offline' ? CloudOff : state === 'syncing' ? RefreshCw : state === 'error' ? TriangleAlert : state === 'synced' ? Check : Cloud;
  return (
    <span
      className={clsx(
        'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold',
        state === 'error' ? 'border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] text-[var(--warning)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
      )}
      role="status"
    >
      <Icon size={14} className={state === 'syncing' ? 'animate-spin' : ''} />
      {!compact && copy[state]}
    </span>
  );
}

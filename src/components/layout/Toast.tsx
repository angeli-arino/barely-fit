import { RotateCcw, X } from 'lucide-react';
import { useAppState } from '../../state/AppState';

export function Toast() {
  const { toast, deletedWorkout, dispatch } = useAppState();
  if (!toast) return null;
  return (
    <div className="fixed inset-x-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[80] mx-auto flex max-w-md items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-strong)] p-3 shadow-[var(--shadow-2)] lg:bottom-6" role="status">
      <p className="min-w-0 flex-1 text-sm font-medium">{toast}</p>
      {deletedWorkout && <button className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent-soft)]" onClick={() => dispatch({ type: 'undo-delete' })}><RotateCcw size={16} /> Undo</button>}
      <button className="grid size-10 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]" aria-label="Dismiss" onClick={() => dispatch({ type: 'clear-toast' })}><X size={17} /></button>
    </div>
  );
}

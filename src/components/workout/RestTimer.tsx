import { Bell, BellOff, Minus, Pause, Play, Plus, SkipForward, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useAppState } from '../../state/AppState';
import { formatSeconds } from '../../lib';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';

export function RestTimerCompact() {
  const { restTimer, dispatch } = useAppState();
  const [expanded, setExpanded] = useState(false);
  const progress = restTimer.initialSec > 0 ? Math.max(0, Math.min(100, ((restTimer.initialSec - restTimer.remainingSec) / restTimer.initialSec) * 100)) : 0;

  return (
    <>
      <button
        className="fixed inset-x-3 bottom-[calc(82px+env(safe-area-inset-bottom))] z-40 mx-auto flex min-h-16 max-w-xl items-center gap-3 overflow-hidden rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface-strong)] px-4 text-left shadow-[var(--shadow-2)] lg:bottom-6 lg:left-[calc(232px+24px)] lg:right-6"
        onClick={() => setExpanded(true)}
        aria-label={`Rest timer ${formatSeconds(restTimer.remainingSec)}. Open timer controls.`}
      >
        <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--border)]"><div className="h-full bg-[var(--accent)] transition-[width]" style={{ width: `${progress}%` }} /></div>
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"><Pause size={18} /></div>
        <div className="min-w-0 flex-1"><div className="text-xs font-bold uppercase tracking-[.12em] text-[var(--text-muted)]">Rest · {restTimer.exerciseName}</div><div className="truncate text-sm font-semibold">Next: {restTimer.nextSetLabel ?? 'continue when ready'}</div></div>
        <div className="metric text-2xl font-black">{formatSeconds(restTimer.remainingSec)}</div>
      </button>
      <RestTimerSheet open={expanded} onOpenChange={setExpanded} />
    </>
  );
}

export function RestTimerSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { restTimer, dispatch } = useAppState();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Rest timer" description="Logging remains available behind this sheet. The timer never blocks the workout.">
      <div className="text-center">
        <div className="text-sm font-semibold text-[var(--text-muted)]">{restTimer.exerciseName}</div>
        <div className="metric my-4 text-7xl font-black tracking-[-.08em]">{formatSeconds(restTimer.remainingSec)}</div>
        <div className="text-sm text-[var(--text-muted)]">Next: <span className="font-semibold text-[var(--text)]">{restTimer.nextSetLabel ?? 'continue when ready'}</span></div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Button onClick={() => dispatch({ type: 'timer-adjust', seconds: -15 })} icon={<Minus size={18} />}>15 sec</Button>
        <Button variant="primary" onClick={() => dispatch({ type: 'timer-pause' })} icon={restTimer.paused ? <Play size={18} /> : <Pause size={18} />}>{restTimer.paused ? 'Resume' : 'Pause'}</Button>
        <Button onClick={() => dispatch({ type: 'timer-adjust', seconds: 15 })} icon={<Plus size={18} />}>15 sec</Button>
      </div>
      <Button className="mt-3" full variant="ghost" onClick={() => { dispatch({ type: 'timer-skip' }); onOpenChange(false); }} icon={<SkipForward size={18} />}>Skip rest</Button>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-5">
        <button className="flex min-h-12 items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold" onClick={() => dispatch({ type: 'timer-sound' })}><span className="flex items-center gap-2">{restTimer.sound ? <Bell size={18} /> : <BellOff size={18} />} Sound</span><span className="text-[var(--text-muted)]">{restTimer.sound ? 'On' : 'Off'}</span></button>
        <button className="flex min-h-12 items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold" onClick={() => dispatch({ type: 'timer-vibration' })}><span className="flex items-center gap-2"><Smartphone size={18} /> Vibration</span><span className="text-[var(--text-muted)]">{restTimer.vibration ? 'On' : 'Off'}</span></button>
      </div>
    </Sheet>
  );
}

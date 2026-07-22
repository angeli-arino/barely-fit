import { ChevronLeft, Clock3, Dumbbell, Flag, Plus, Trash2, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExerciseBlockCard } from '../components/workout/ExerciseCard';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { SyncStatus } from '../components/layout/SyncStatus';
import { useAppState } from '../state/AppState';
import { countCompletedWorkingSets, countTargetWorkingSets, formatSeconds } from '../lib';

export function ActiveWorkoutPage() {
  const { activeWorkout, syncState, dispatch } = useAppState();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(() => activeWorkout?.startedAt ? Math.max(0, Math.floor((Date.now() - new Date(activeWorkout.startedAt).getTime()) / 1000)) : 0);
  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed(activeWorkout?.startedAt ? Math.max(0, Math.floor((Date.now() - new Date(activeWorkout.startedAt).getTime()) / 1000)) : 0), 1000);
    return () => window.clearInterval(timer);
  }, [activeWorkout?.startedAt]);

  const stats = useMemo(() => activeWorkout ? {
    complete: countCompletedWorkingSets(activeWorkout.blocks),
    total: countTargetWorkingSets(activeWorkout.blocks),
  } : { complete: 0, total: 0 }, [activeWorkout]);

  if (!activeWorkout) {
    return (
      <div className="grid min-h-[70dvh] place-items-center text-center">
        <div><div className="mx-auto grid size-14 place-items-center rounded-[16px] bg-[var(--surface)] text-[var(--text-muted)]"><Dumbbell size={25} /></div><h1 className="mt-5 text-2xl font-black">No active workout</h1><p className="mt-2 text-[var(--text-muted)]">Start from Today or a template.</p><Button className="mt-5" variant="primary" onClick={() => navigate('/today')}>Go to Today</Button></div>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <header className="safe-top sticky top-0 z-30 -mx-4 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] px-4 pb-3 backdrop-blur-xl lg:-mx-8 lg:px-8">
        <div className="mx-auto max-w-[900px]">
          <div className="flex items-center gap-3">
            <Link to="/today" className="grid size-11 shrink-0 place-items-center rounded-[12px] text-[var(--text-muted)] hover:bg-[var(--surface)]" aria-label="Back to Today"><ChevronLeft size={24} /></Link>
            <div className="min-w-0 flex-1"><div className="truncate font-black tracking-[-.02em]">{activeWorkout.name}</div><div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]"><Clock3 size={13} /><span className="metric">{formatSeconds(elapsed)}</span><span>·</span><span>{stats.complete}/{stats.total} working sets</span></div></div>
            <SyncStatus state={syncState} compact />
            <button className="min-h-11 rounded-[12px] px-3 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent-soft)]" onClick={() => setFinishOpen(true)}>Finish</button>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--border)]"><div className="h-full rounded-full bg-[var(--accent)] transition-[width]" style={{ width: `${(stats.complete / Math.max(1, stats.total)) * 100}%` }} /></div>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] pt-5">
        {syncState === 'offline' && <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"><WifiOff size={17} className="text-[var(--text-muted)]" /><span><strong>Offline.</strong> Every change is still saved on this device.</span></div>}
        <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--text-muted)]"><strong className="text-[var(--text)]">Recovered workout.</strong> The app was closed after the last edit; no set was counted unless Complete Set was pressed.</div>
        <div className="space-y-4">
          {activeWorkout.blocks.map((block, index) => <ExerciseBlockCard key={block.id} block={block} blockIndex={index} totalBlocks={activeWorkout.blocks.length} />)}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button size="lg" icon={<Plus size={18} />} onClick={() => navigate('/exercises')}>Add or replace exercise</Button>
          <Button size="lg" variant="ghost" icon={<Trash2 size={18} />} onClick={() => setDiscardOpen(true)}>Discard workout</Button>
        </div>
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="font-bold">Changes stay with this Active Workout</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Targets, exercises, and order may diverge freely from the source template. After finishing, you will be offered an explicit Update Template choice.</p>
        </div>
      </div>

      <Sheet open={finishOpen} onOpenChange={setFinishOpen} title="Finish workout?" description={`${stats.complete} of ${stats.total} working sets are complete. Incomplete targets will not enter history or progress.`}>
        <div className="rounded-[var(--radius-md)] bg-[var(--surface)] p-4"><div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Duration</span><span className="metric font-bold">{formatSeconds(elapsed)}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-[var(--text-muted)]">Working sets</span><span className="font-bold">{stats.complete}</span></div></div>
        <Button className="mt-4" variant="primary" size="lg" full icon={<Flag size={19} />} onClick={() => { dispatch({ type: 'finish-workout' }); setFinishOpen(false); navigate('/history'); }}>Finish and save</Button>
        <Button className="mt-2" full variant="ghost" onClick={() => setFinishOpen(false)}>Keep training</Button>
        <p className="mt-4 text-center text-xs text-[var(--text-faint)]">Template remains unchanged unless you choose Update Template afterward.</p>
      </Sheet>

      <Sheet open={discardOpen} onOpenChange={setDiscardOpen} title="Discard active workout?" description="This removes the one resumable workout from this device. Completed history is unaffected.">
        <Button variant="danger" size="lg" full onClick={() => { dispatch({ type: 'discard-workout' }); setDiscardOpen(false); navigate('/today'); }}>Discard workout</Button>
        <Button className="mt-2" full variant="ghost" onClick={() => setDiscardOpen(false)}>Cancel</Button>
      </Sheet>
    </div>
  );
}

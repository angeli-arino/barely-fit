import { ArrowLeft, Check, Clock3, Edit3, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { formatDate } from '../lib';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import type { PerformedSet } from '../types';

type DraftSetValues = { load?: string; reps?: string; assistance?: string; durationSec?: string; distanceKm?: string };

export function WorkoutDetailPage() {
  const { workoutId } = useParams();
  const { workouts, exercises, dispatch } = useAppState();
  const navigate = useNavigate();
  const workout = workouts.find((candidate) => candidate.id === workoutId);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, DraftSetValues>>({});

  if (!workout) return <div className="py-20 text-center"><h1 className="text-2xl font-black">Workout not found</h1><Link className="mt-4 inline-block font-bold text-[var(--accent)]" to="/history">Back to history</Link></div>;

  const saveCorrections = () => {
    Object.entries(draft).forEach(([setId, values]) => dispatch({
      type: 'correct-completed-set',
      workoutId: workout.id,
      setId,
      values: {
        load: values.load === undefined || values.load === '' ? undefined : Number(values.load),
        reps: values.reps === undefined || values.reps === '' ? undefined : Number(values.reps),
        assistance: values.assistance === undefined || values.assistance === '' ? undefined : Number.isNaN(Number(values.assistance)) ? values.assistance : Number(values.assistance),
        durationSec: values.durationSec === undefined || values.durationSec === '' ? undefined : Number(values.durationSec),
        distanceKm: values.distanceKm === undefined || values.distanceKm === '' ? undefined : Number(values.distanceKm),
      },
    }));
    setEditing(false);
    setDraft({});
  };

  const updateDraft = (set: PerformedSet, key: keyof DraftSetValues, value: string) => {
    setDraft((current) => ({ ...current, [set.id]: { load: String(set.load ?? ''), reps: String(set.reps ?? ''), assistance: String(set.assistance ?? ''), durationSec: String(set.durationSec ?? ''), distanceKm: String(set.distanceKm ?? ''), ...current[set.id], [key]: value } }));
  };

  return (
    <div className="mx-auto max-w-[900px] animate-rise">
      <header className="mb-6 flex items-start gap-3"><Link to="/history" className="grid size-11 shrink-0 place-items-center rounded-[12px] text-[var(--text-muted)] hover:bg-[var(--surface)]" aria-label="Back to history"><ArrowLeft size={21} /></Link><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--text-muted)]">{formatDate(workout.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><h1 className="mt-1 text-3xl font-black tracking-[-.045em]">{workout.name}</h1><div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]"><Clock3 size={16} /> {workout.durationMin} minutes <span>·</span> <Check size={15} className="text-[var(--success)]" /> completed</div></div><Button variant={editing ? 'primary' : 'secondary'} icon={editing ? <Save size={17} /> : <Edit3 size={17} />} onClick={editing ? saveCorrections : () => setEditing(true)}>{editing ? 'Save' : 'Correct'}</Button></header>

      {editing && <div className="mb-4 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_7%,var(--surface))] p-4 text-sm leading-6 text-[var(--text-muted)]"><strong className="text-[var(--text)]">Correction mode.</strong> Saving immediately recalculates records, volume, and trend data. Warm-up sets remain excluded from Progress.</div>}

      <div className="space-y-4">
        {workout.blocks.map((block) => (
          <section key={block.id} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-1)]">
            {block.type !== 'single' && <div className="border-b border-[var(--border)] bg-[var(--accent-soft)] px-4 py-2 text-xs font-black uppercase tracking-[.12em] text-[var(--accent)]">{block.type}{block.title ? ` · ${block.title}` : ''}</div>}
            <div className="divide-y divide-[var(--border)]">
              {block.exercises.map((item) => {
                const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
                if (!exercise) return null;
                return <article key={item.id} className="p-4 sm:p-5"><h2 className="text-lg font-bold">{exercise.name}</h2><p className="mt-1 text-sm text-[var(--text-muted)]">{item.notes || item.priorSummary}</p><div className="mt-4 space-y-2">{item.sets.filter((set) => set.completed).map((set, index) => <CompletedSetRow key={set.id} set={set} index={index} editing={editing} draft={draft[set.id]} onChange={(key, value) => updateDraft(set, key, value)} />)}</div></article>;
              })}
            </div>
          </section>
        ))}
      </div>

      {workout.notes && <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5"><div className="text-xs font-black uppercase tracking-[.12em] text-[var(--text-faint)]">Workout notes</div><p className="mt-2 leading-7 text-[var(--text-muted)]">{workout.notes}</p></div>}
      {workout.templateId && <Button className="mt-5" full icon={<RefreshCw size={17} />} onClick={() => dispatch({ type: 'update-template-from-workout', workoutId: workout.id })}>Update source Workout Template</Button>}
      <Button className="mt-5" variant="danger" full icon={<Trash2 size={17} />} onClick={() => setDeleteOpen(true)}>Delete completed workout</Button>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete completed workout?" description="This removes every performed set and recalculates Progress. You can undo immediately after deletion.">
        <Button variant="danger" size="lg" full onClick={() => { dispatch({ type: 'delete-workout', workoutId: workout.id }); setDeleteOpen(false); navigate('/history'); }}>Delete workout</Button>
        <Button className="mt-2" full variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
      </Sheet>
    </div>
  );
}

function CompletedSetRow({ set, index, editing, draft, onChange }: { set: PerformedSet; index: number; editing: boolean; draft?: DraftSetValues; onChange: (key: 'load' | 'reps' | 'assistance' | 'durationSec' | 'distanceKm', value: string) => void }) {
  const value = (key: keyof DraftSetValues, fallback: unknown) => draft?.[key] ?? String(fallback ?? '');
  if (editing) {
    return <div className="grid grid-cols-[70px_repeat(2,minmax(0,1fr))] gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-2 sm:grid-cols-[90px_repeat(5,minmax(0,1fr))]"><div className="flex items-center px-2 text-xs font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">{set.kind === 'warmup' ? 'Warm-up' : `Set ${index + 1}`}</div>{set.load !== undefined && <EditCell label="kg" value={value('load', set.load)} onChange={(next) => onChange('load', next)} />}{set.assistance !== undefined && <EditCell label="assist" value={value('assistance', set.assistance)} onChange={(next) => onChange('assistance', next)} />}{set.reps !== undefined && <EditCell label="reps" value={value('reps', set.reps)} onChange={(next) => onChange('reps', next)} />}{set.durationSec !== undefined && <EditCell label="sec" value={value('durationSec', set.durationSec)} onChange={(next) => onChange('durationSec', next)} />}{set.distanceKm !== undefined && <EditCell label="km" value={value('distanceKm', set.distanceKm)} onChange={(next) => onChange('distanceKm', next)} />}</div>;
  }
  const pieces = [set.load !== undefined ? `${set.load} kg` : null, set.assistance !== undefined ? `${set.assistance}${typeof set.assistance === 'number' ? ' kg assist' : ''}` : null, set.reps !== undefined ? `${set.reps} reps` : null, set.durationSec !== undefined ? `${set.durationSec} sec` : null, set.distanceKm !== undefined ? `${set.distanceKm} km` : null, set.rir !== undefined ? `RIR ${set.rir}` : null].filter(Boolean);
  return <div className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] px-3"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-black ${set.kind === 'warmup' ? 'bg-[color-mix(in_srgb,var(--warning)_13%,transparent)] text-[var(--warning)]' : 'bg-[var(--surface-strong)] text-[var(--text-muted)]'}`}>{set.kind === 'warmup' ? 'W' : index + 1}</span><span className="flex-1 text-sm font-semibold">{pieces.join(' · ')}</span>{set.kind === 'warmup' && <span className="text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">excluded</span>}</div>;
}

function EditCell({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1"><span className="block text-[9px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">{label}</span><input className="w-full bg-transparent font-bold outline-none" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

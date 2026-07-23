import { ArrowLeft, Check, Clock3, Edit3, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { formatDate } from '../lib';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import type { ExerciseItem, PerformedSet, Workout } from '../types';
import { validateCompletedWorkout } from '../domain/workoutHistory';

const optionalNumber = (value: string) => value === '' ? undefined : Number(value);
const optionalAssistance = (value: string) => value === '' ? undefined : Number.isNaN(Number(value)) ? value : Number(value);

export function WorkoutDetailPage() {
  const { workoutId } = useParams();
  const { workouts, exercises, dispatch } = useAppState();
  const navigate = useNavigate();
  const workout = workouts.find((candidate) => candidate.id === workoutId && candidate.status === 'completed');
  const [draft, setDraft] = useState<Workout | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  useEffect(() => { setDraft(null); setDeleteOpen(false); }, [workoutId]);

  if (!workout) return <div className="py-20 text-center"><h1 className="text-2xl font-black">Workout not found</h1><Link className="mt-4 inline-block font-bold text-[var(--accent)]" to="/history">Back to history</Link></div>;

  const shown = draft ?? workout;
  const editing = Boolean(draft);
  const updateItem = (itemId: string, updater: (item: ExerciseItem) => ExerciseItem) => setDraft((current) => current ? ({
    ...current,
    blocks: current.blocks.map((block) => ({ ...block, exercises: block.exercises.map((item) => item.id === itemId ? updater(item) : item) })),
  }) : current);
  const updateSet = (itemId: string, setId: string, updater: (set: PerformedSet) => PerformedSet) =>
    updateItem(itemId, (item) => ({ ...item, sets: item.sets.map((set) => set.id === setId ? updater(set) : set) }));
  const removeSet = (itemId: string, setId: string) =>
    updateItem(itemId, (item) => ({ ...item, sets: item.sets.filter((set) => set.id !== setId) }));
  const addSet = (item: ExerciseItem) => {
    const previous = item.sets.filter((set) => set.completed).at(-1);
    const added: PerformedSet = {
      ...(previous ?? { kind: 'working' as const }),
      id: crypto.randomUUID(),
      completed: true,
      completedAt: shown.completedAt,
      notes: undefined,
    };
    updateItem(item.id, (current) => ({ ...current, sets: [...current.sets, added] }));
  };
  const makePerformedItem = (): ExerciseItem | undefined => {
    const exercise = exercises[0];
    if (!exercise) return undefined;
    return {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      restSec: exercise.defaultRestSec ?? 90,
      priorSummary: 'Added as a Workout History correction',
      sets: [{ id: crypto.randomUUID(), kind: 'working', completed: true, completedAt: shown.completedAt }],
    };
  };
  const addExercise = (blockId: string) => {
    const item = makePerformedItem();
    if (!item) return;
    setDraft((current) => current ? ({ ...current, blocks: current.blocks.map((block) => {
      if (block.id !== blockId) return block;
      const nextExercises = [...block.exercises, item];
      const type = nextExercises.length === 2 && block.type !== 'rounds' ? 'paired' : nextExercises.length > 2 ? 'rounds' : block.type;
      return { ...block, exercises: nextExercises, type, rounds: type === 'rounds' ? (block.rounds ?? Math.max(...nextExercises.map((exercise) => exercise.sets.length))) : undefined };
    }) }) : current);
  };
  const removeExercise = (blockId: string, itemId: string) =>
    setDraft((current) => current ? ({ ...current, blocks: current.blocks.map((block) => {
      if (block.id !== blockId) return block;
      const nextExercises = block.exercises.filter((item) => item.id !== itemId);
      const type = nextExercises.length === 1 ? 'single' : block.type;
      return { ...block, exercises: nextExercises, type, rounds: type === 'rounds' ? block.rounds : undefined };
    }).filter((block) => block.exercises.length > 0) }) : current);
  const addBlock = () => {
    const item = makePerformedItem();
    if (!item) return;
    setDraft((current) => current ? ({ ...current, blocks: [...current.blocks, { id: crypto.randomUUID(), type: 'single', exercises: [item] }] }) : current);
  };
  const removeBlock = (blockId: string) =>
    setDraft((current) => current ? ({ ...current, blocks: current.blocks.filter((block) => block.id !== blockId) }) : current);
  const save = () => {
    if (!draft) return;
    const error = validateCompletedWorkout(draft);
    if (error) {
      dispatch({ type: 'notify', message: error });
      return;
    }
    dispatch({ type: 'correct-completed-workout', workout: draft });
    setDraft(null);
  };

  return (
    <div className="mx-auto max-w-[900px] animate-rise">
      <header className="mb-6 flex items-start gap-3">
        <Link to="/history" className="grid size-11 shrink-0 place-items-center rounded-[12px] text-[var(--text-muted)] hover:bg-[var(--surface)]" aria-label="Back to history"><ArrowLeft size={21} /></Link>
        <div className="min-w-0 flex-1">
          {editing ? <input type="date" className="input max-w-48" value={shown.date} onChange={(event) => setDraft((current) => current ? { ...current, date: event.target.value } : current)} aria-label="Workout date" /> : <p className="text-sm font-semibold text-[var(--text-muted)]">{formatDate(shown.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
          {editing ? <input className="mt-2 w-full bg-transparent text-3xl font-black tracking-[-.045em] outline-none" value={shown.name} onChange={(event) => setDraft((current) => current ? { ...current, name: event.target.value } : current)} aria-label="Workout name" /> : <h1 className="mt-1 text-3xl font-black tracking-[-.045em]">{shown.name}</h1>}
          <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]"><Clock3 size={16} /> {shown.durationMin} minutes <span>·</span> <Check size={15} className="text-[var(--success)]" /> completed</div>
        </div>
        <Button variant={editing ? 'primary' : 'secondary'} icon={editing ? <Save size={17} /> : <Edit3 size={17} />} onClick={editing ? save : () => setDraft(structuredClone(workout))}>{editing ? 'Save' : 'Correct'}</Button>
      </header>

      {editing && <div className="mb-4 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_7%,var(--surface))] p-4 text-sm leading-6 text-[var(--text-muted)]"><strong className="text-[var(--text)]">Correction mode.</strong> One save updates the canonical Workout History record and recalculates Progress. Warm-up Sets remain excluded.</div>}

      <div className="space-y-4">
        {shown.blocks.map((block) => (
          <section key={block.id} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-1)]">
            <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--accent-soft)] px-4 py-2 text-xs font-black uppercase tracking-[.12em] text-[var(--accent)]">{editing ? <><select className="bg-transparent" value={block.type} onChange={(event) => setDraft((current) => current ? ({ ...current, blocks: current.blocks.map((candidate) => {
              if (candidate.id !== block.id) return candidate;
              const type = event.target.value as typeof block.type;
              return { ...candidate, type, rounds: type === 'rounds' ? (candidate.rounds ?? Math.max(...candidate.exercises.map((exercise) => exercise.sets.length))) : undefined };
            }) }) : current)}>{block.exercises.length === 1 && <option value="single">Single Exercise Block</option>}{block.exercises.length === 2 && <option value="paired">Paired Exercise Block</option>}{block.exercises.length >= 2 && <option value="rounds">Rounds Exercise Block</option>}</select>{block.type === 'rounds' && <label className="flex items-center gap-2 normal-case tracking-normal">Rounds <input type="number" min="1" className="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1" value={block.rounds ?? 1} onChange={(event) => setDraft((current) => current ? ({ ...current, blocks: current.blocks.map((candidate) => candidate.id === block.id ? { ...candidate, rounds: Math.max(1, Number(event.target.value) || 1) } : candidate) }) : current)} /></label>}</> : <span>{block.type === 'single' ? 'Single Exercise Block' : `${block.type} Exercise Block`}{block.title ? ` · ${block.title}` : ''}</span>}<span className="flex-1" />{editing && <button className="min-h-9 rounded-lg px-2 text-[var(--danger)]" onClick={() => removeBlock(block.id)}>Remove Block</button>}</div>
            <div className="divide-y divide-[var(--border)]">
              {block.exercises.map((item) => {
                const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
                return <article key={item.id} className="p-4 sm:p-5">
                  <div className="flex items-center gap-2">{editing ? <select className="input flex-1 font-bold" value={item.exerciseId} onChange={(event) => updateItem(item.id, (current) => ({ ...current, exerciseId: event.target.value }))} aria-label="Correct Exercise">{exercises.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select> : <h2 className="text-lg font-bold">{exercise?.name ?? item.exerciseId}</h2>}{editing && <Button variant="danger" icon={<Trash2 size={15} />} onClick={() => removeExercise(block.id, item.id)}>Remove Exercise</Button>}</div>
                  {editing ? <textarea className="input mt-3 min-h-20 py-3" value={item.notes ?? ''} placeholder="Exercise notes" onChange={(event) => updateItem(item.id, (current) => ({ ...current, notes: event.target.value || undefined }))} /> : <p className="mt-1 text-sm text-[var(--text-muted)]">{item.notes || item.priorSummary}</p>}
                  <div className="mt-4 space-y-2">{item.sets.filter((set) => set.completed).map((set, index) => <CompletedSetRow key={set.id} set={set} index={index} editing={editing} onChange={(updater) => updateSet(item.id, set.id, updater)} onRemove={() => removeSet(item.id, set.id)} />)}</div>
                  {editing && <Button className="mt-3" variant="ghost" icon={<Plus size={16} />} onClick={() => addSet(item)}>Add performed Set</Button>}
                </article>;
              })}
            </div>
            {editing && <div className="border-t border-[var(--border)] p-3"><Button variant="ghost" icon={<Plus size={16} />} onClick={() => addExercise(block.id)}>Add performed Exercise</Button></div>}
          </section>
        ))}
      </div>
      {editing && <Button className="mt-4" full variant="ghost" icon={<Plus size={16} />} onClick={addBlock}>Add Exercise Block</Button>}

      <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5"><div className="text-xs font-black uppercase tracking-[.12em] text-[var(--text-faint)]">Workout notes</div>{editing ? <textarea className="input mt-3 min-h-24 py-3" value={shown.notes ?? ''} onChange={(event) => setDraft((current) => current ? { ...current, notes: event.target.value || undefined } : current)} /> : <p className="mt-2 leading-7 text-[var(--text-muted)]">{shown.notes || 'No Workout notes.'}</p>}</div>
      {editing && <Button className="mt-3" full variant="ghost" onClick={() => setDraft(null)}>Cancel corrections</Button>}
      {!editing && shown.templateId && <Button className="mt-5" full icon={<RefreshCw size={17} />} onClick={() => dispatch({ type: 'update-template-from-workout', workoutId: shown.id })}>Update source Workout Template</Button>}
      {!editing && <Button className="mt-5" variant="danger" full icon={<Trash2 size={17} />} onClick={() => setDeleteOpen(true)}>Delete completed Workout</Button>}

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete completed Workout?" description="This removes every performed Set and recalculates Progress. You can undo immediately after deletion.">
        <Button variant="danger" size="lg" full onClick={() => { dispatch({ type: 'delete-workout', workoutId: shown.id }); setDeleteOpen(false); navigate('/history'); }}>Delete Workout</Button>
        <Button className="mt-2" full variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
      </Sheet>
    </div>
  );
}

function CompletedSetRow({ set, index, editing, onChange, onRemove }: { set: PerformedSet; index: number; editing: boolean; onChange: (updater: (set: PerformedSet) => PerformedSet) => void; onRemove: () => void }) {
  if (editing) return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
    <div className="grid gap-2 sm:grid-cols-4">
      <label className="input"><span className="text-[10px] uppercase text-[var(--text-faint)]">Classification</span><select className="w-full bg-transparent font-bold" value={set.kind} onChange={(event) => onChange((current) => ({ ...current, kind: event.target.value as PerformedSet['kind'] }))}><option value="working">Working</option><option value="warmup">Warm-up</option></select></label>
      <EditCell label="Load" value={set.load} onChange={(value) => onChange((current) => ({ ...current, load: optionalNumber(value) }))} />
      <EditCell label="Repetitions" value={set.reps} onChange={(value) => onChange((current) => ({ ...current, reps: optionalNumber(value) }))} />
      <EditCell label="Assistance" value={set.assistance} onChange={(value) => onChange((current) => ({ ...current, assistance: optionalAssistance(value) }))} />
      <EditCell label="Duration sec" value={set.durationSec} onChange={(value) => onChange((current) => ({ ...current, durationSec: optionalNumber(value) }))} />
      <EditCell label="Distance km" value={set.distanceKm} onChange={(value) => onChange((current) => ({ ...current, distanceKm: optionalNumber(value) }))} />
      <EditCell label="RIR" value={set.rir} onChange={(value) => onChange((current) => ({ ...current, rir: optionalNumber(value) }))} />
      <Button variant="danger" icon={<Trash2 size={15} />} onClick={onRemove}>Remove Set</Button>
    </div>
    <textarea className="input mt-2 min-h-16 py-2" value={set.notes ?? ''} placeholder="Set notes" onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value || undefined }))} />
  </div>;

  const pieces = [set.load !== undefined ? `${set.load} kg` : null, set.assistance !== undefined ? `${set.assistance}${typeof set.assistance === 'number' ? ' kg assist' : ''}` : null, set.reps !== undefined ? `${set.reps} reps` : null, set.durationSec !== undefined ? `${set.durationSec} sec` : null, set.distanceKm !== undefined ? `${set.distanceKm} km` : null, set.rir !== undefined ? `RIR ${set.rir}` : null].filter(Boolean);
  return <div className="rounded-[var(--radius-md)] bg-[var(--bg-elevated)] px-3 py-2"><div className="flex min-h-8 items-center gap-3"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-black ${set.kind === 'warmup' ? 'bg-[color-mix(in_srgb,var(--warning)_13%,transparent)] text-[var(--warning)]' : 'bg-[var(--surface-strong)] text-[var(--text-muted)]'}`}>{set.kind === 'warmup' ? 'W' : index + 1}</span><span className="flex-1 text-sm font-semibold">{pieces.join(' · ') || 'Completed Set'}</span><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">{set.kind}</span></div>{set.notes && <p className="ml-10 mt-1 text-sm text-[var(--text-muted)]">{set.notes}</p>}</div>;
}

function EditCell({ label, value, onChange }: { label: string; value: string | number | undefined; onChange: (value: string) => void }) {
  return <label className="input"><span className="block text-[10px] uppercase text-[var(--text-faint)]">{label}</span><input type="number" min="0" step="any" className="w-full bg-transparent font-bold outline-none" value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></label>;
}

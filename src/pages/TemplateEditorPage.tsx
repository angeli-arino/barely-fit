import { ArrowDown, ArrowLeft, ArrowUp, Check, GripVertical, Plus, Repeat2, Save, TimerReset, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { exerciseBlockLabel, nextExerciseBlockType } from '../lib';
import { useAppState } from '../state/AppState';
import type { ExerciseBlock, ExerciseBlockType, ExerciseItem, WorkoutTemplate } from '../types';

type ExercisePicker = { blockId: string; itemId?: string };

export function TemplateEditorPage() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { templates, exercises, dispatch } = useAppState();
  const source = templates.find((template) => template.id === templateId) ?? templates[0];
  const [name, setName] = useState(source.name);
  const [blocks, setBlocks] = useState<ExerciseBlock[]>(structuredClone(source.blocks));
  const [addOpen, setAddOpen] = useState(false);
  const [exercisePicker, setExercisePicker] = useState<ExercisePicker | null>(null);
  const [saved, setSaved] = useState(false);

  const exerciseCount = useMemo(() => blocks.reduce((sum, block) => sum + block.exercises.length, 0), [blocks]);
  const move = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= blocks.length) return;
    setBlocks((current) => {
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };
  const removeItem = (itemId: string) => setBlocks((current) => current
    .map((block) => ({ ...block, exercises: block.exercises.filter((item) => item.id !== itemId) }))
    .filter((block) => block.exercises.length > 0));
  const cycleBlockType = (blockId: string) => setBlocks((current) => current.map((block) => {
    if (block.id !== blockId) return block;
    const type = nextExerciseBlockType(block.type);
    return { ...block, type, rounds: type === 'rounds' ? 3 : undefined };
  }));
  const updateItem = (blockId: string, itemId: string, updater: (item: ExerciseItem) => ExerciseItem) =>
    setBlocks((current) => current.map((block) => block.id !== blockId ? block : ({
      ...block,
      exercises: block.exercises.map((item) => item.id === itemId ? updater(item) : item),
    })));
  const updateSetCount = (blockId: string, item: ExerciseItem, requested: number) => {
    const count = Math.max(1, Math.min(20, requested || 1));
    const seed = item.sets.at(-1) ?? { id: '', kind: 'working' as const, completed: false };
    const sets = Array.from({ length: count }, (_, index) => item.sets[index] ?? {
      ...seed,
      id: `${item.id}-set-${Date.now()}-${index}`,
      completed: false,
      completedAt: undefined,
    });
    updateItem(blockId, item.id, (current) => ({ ...current, sets }));
  };
  const makeItem = (exerciseId: string, suffix: string): ExerciseItem => ({
    id: `template-item-${Date.now()}-${suffix}`,
    exerciseId,
    restSec: 90,
    priorSummary: 'No prior template performance',
    sets: [{ id: `template-set-${Date.now()}-${suffix}`, kind: 'working', targetReps: 10, completed: false }],
  });
  const addBlock = (type: ExerciseBlockType) => {
    const first = exercises[0];
    const second = exercises[1] ?? first;
    const block: ExerciseBlock = {
      id: `template-block-${Date.now()}`,
      type,
      rounds: type === 'rounds' ? 3 : undefined,
      exercises: type === 'single' ? [makeItem(first.id, 'a')] : [makeItem(first.id, 'a'), makeItem(second.id, 'b')],
    };
    setBlocks((current) => [...current, block]);
    setAddOpen(false);
  };
  const selectExercise = (exerciseId: string) => {
    if (!exercisePicker) return;
    setBlocks((current) => current.map((block) => {
      if (block.id !== exercisePicker.blockId) return block;
      if (exercisePicker.itemId) {
        return { ...block, exercises: block.exercises.map((item) => item.id === exercisePicker.itemId ? { ...item, exerciseId } : item) };
      }
      return { ...block, exercises: [...block.exercises, makeItem(exerciseId, String(block.exercises.length))] };
    }));
    setExercisePicker(null);
  };
  const saveTemplate = () => {
    const template: WorkoutTemplate = { ...source, name: name.trim() || source.name, blocks, updatedAt: new Date().toISOString().slice(0, 10) };
    dispatch({ type: 'save-template', template });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="mx-auto max-w-[920px] animate-rise">
      <header className="mb-6 flex items-start gap-3">
        <Link to="/templates" className="grid size-11 shrink-0 place-items-center rounded-[12px] text-[var(--text-muted)] hover:bg-[var(--surface)]" aria-label="Back to Workout Templates"><ArrowLeft size={21} /></Link>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--text-muted)]">Workout Template editor</p><input className="mt-1 w-full bg-transparent text-3xl font-black tracking-[-.045em] outline-none sm:text-4xl" value={name} onChange={(event) => setName(event.target.value)} aria-label="Workout Template name" /></div>
        <Button variant="primary" icon={saved ? <Check size={18} /> : <Save size={18} />} onClick={saveTemplate}>{saved ? 'Saved' : 'Save'}</Button>
      </header>
      <div className="mb-5 grid grid-cols-3 gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 text-center"><div><div className="metric text-2xl font-black">{blocks.length}</div><div className="text-xs text-[var(--text-faint)]">blocks</div></div><div><div className="metric text-2xl font-black">{exerciseCount}</div><div className="text-xs text-[var(--text-faint)]">Exercises</div></div><div><div className="metric text-2xl font-black">{source.estimatedMin}</div><div className="text-xs text-[var(--text-faint)]">minutes</div></div></div>
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <section key={block.id} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-1)]">
            <div className="flex min-h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-3"><GripVertical size={19} className="text-[var(--text-faint)]" /><div className="min-w-0 flex-1"><div className="text-xs font-black uppercase tracking-[.12em] text-[var(--accent)]">{exerciseBlockLabel(block)}</div><div className="truncate text-sm font-bold">{block.title ?? `Exercise Block ${index + 1}`}</div></div><button className="grid size-10 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-strong)] disabled:opacity-30" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move Exercise Block up"><ArrowUp size={17} /></button><button className="grid size-10 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-strong)] disabled:opacity-30" disabled={index === blocks.length - 1} onClick={() => move(index, 1)} aria-label="Move Exercise Block down"><ArrowDown size={17} /></button></div>
            <div className="divide-y divide-[var(--border)]">
              {block.exercises.map((item) => {
                const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
                if (!exercise) return null;
                return <div key={item.id} className="p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="font-bold">{exercise.name}</div><div className="mt-1 text-sm text-[var(--text-muted)]">{item.sets.length} Set Targets · {exercise.measurementType.replaceAll('-', ' + ')}</div></div><Button size="sm" variant="ghost" onClick={() => setExercisePicker({ blockId: block.id, itemId: item.id })}>Replace</Button></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6"><label className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"><span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">Sets</span><input type="number" min="1" max="20" className="mt-1 w-full bg-transparent font-bold outline-none" value={item.sets.length} onChange={(event) => updateSetCount(block.id, item, Number(event.target.value))} /></label>{exercise.measurementType.includes('reps') && <TargetInput label="Target reps" value={item.sets[0]?.targetReps} onChange={(value) => updateItem(block.id, item.id, (current) => ({ ...current, sets: current.sets.map((set) => ({ ...set, targetReps: value })) }))} />}{exercise.measurementType === 'reps-load' && <TargetInput label={exercise.equipment.includes('Barbell') ? 'Total Load' : 'Load / side'} value={item.sets[0]?.targetLoad} onChange={(value) => updateItem(block.id, item.id, (current) => ({ ...current, sets: current.sets.map((set) => ({ ...set, targetLoad: value })) }))} />}{exercise.measurementType === 'reps-assistance' && <TargetInput label="Assistance" value={typeof item.sets[0]?.targetAssistance === 'number' ? item.sets[0].targetAssistance : undefined} onChange={(value) => updateItem(block.id, item.id, (current) => ({ ...current, sets: current.sets.map((set) => ({ ...set, targetAssistance: value })) }))} />}{exercise.measurementType.includes('duration') && <TargetInput label="Duration sec" value={item.sets[0]?.targetDurationSec} onChange={(value) => updateItem(block.id, item.id, (current) => ({ ...current, sets: current.sets.map((set) => ({ ...set, targetDurationSec: value })) }))} />}{exercise.measurementType.includes('distance') && <TargetInput label="Distance km" value={item.sets[0]?.targetDistanceKm} step="0.1" onChange={(value) => updateItem(block.id, item.id, (current) => ({ ...current, sets: current.sets.map((set) => ({ ...set, targetDistanceKm: value })) }))} />}<label className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"><span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">First Set</span><select className="mt-1 w-full bg-transparent font-bold outline-none" value={item.sets[0]?.kind ?? 'working'} onChange={(event) => updateItem(block.id, item.id, (current) => ({ ...current, sets: current.sets.map((set, setIndex) => setIndex === 0 ? ({ ...set, kind: event.target.value as 'warmup' | 'working' }) : set) }))}><option value="working">Working</option><option value="warmup">Warm-up</option></select></label><label className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"><span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]"><TimerReset size={12} /> Default rest</span><input type="number" min="0" className="mt-1 w-full bg-transparent font-bold outline-none" value={item.restSec} onChange={(event) => updateItem(block.id, item.id, (current) => ({ ...current, restSec: Math.max(0, Number(event.target.value)) }))} /></label><button onClick={() => removeItem(item.id)} className="grid min-h-12 place-items-center rounded-[12px] border border-[var(--border)] px-3 text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]" aria-label={`Remove ${exercise.name}`}><Trash2 size={17} /></button></div></div>;
              })}
            </div>
            <div className="grid grid-cols-2 border-t border-[var(--border)]"><button onClick={() => setExercisePicker({ blockId: block.id })} className="flex min-h-12 items-center justify-center gap-2 border-r border-[var(--border)] text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--surface-strong)]"><Plus size={16} /> Add Exercise</button><button onClick={() => cycleBlockType(block.id)} className="flex min-h-12 items-center justify-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--surface-strong)]"><Repeat2 size={16} /> Change block type</button></div>
          </section>
        ))}
      </div>
      <Button className="mt-4" size="lg" full icon={<Plus size={18} />} onClick={() => setAddOpen(true)}>Add Exercise Block</Button>
      <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="font-bold">Workout Template safety</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Saving here changes future starts only. It never rewrites Workout History or the current Active Workout.</p></div>
      <div className="mt-4 flex justify-end"><Button variant="ghost" onClick={() => navigate('/templates')}>Done</Button></div>

      <Sheet open={addOpen} onOpenChange={setAddOpen} title="Add Exercise Block" description="Choose how Exercises will be performed together.">
        <div className="space-y-2"><BlockChoice title="Single Exercise" description="Straight Sets with Exercise-specific rest." onClick={() => addBlock('single')} /><BlockChoice title="Paired Exercise Block" description="Alternate two Exercises before resting." onClick={() => addBlock('paired')} /><BlockChoice title="Rounds Exercise Block" description="Repeat ordered Exercises for a configured number of rounds." onClick={() => addBlock('rounds')} /></div>
      </Sheet>
      <Sheet open={Boolean(exercisePicker)} onOpenChange={(open) => !open && setExercisePicker(null)} title={exercisePicker?.itemId ? 'Replace Exercise' : 'Add Exercise'} description="Choose from the local Exercise Catalog.">
        <div className="space-y-2">{exercises.map((exercise) => <button key={exercise.id} className="flex min-h-12 w-full items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 text-left font-semibold hover:bg-[var(--surface-strong)]" onClick={() => selectExercise(exercise.id)}>{exercise.name}</button>)}</div>
      </Sheet>
    </div>
  );
}

function TargetInput({ label, value, step = '1', onChange }: { label: string; value?: number; step?: string; onChange: (value?: number) => void }) {
  return <label className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"><span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">{label}</span><input type="number" min="0" step={step} className="mt-1 w-full bg-transparent font-bold outline-none" value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))} /></label>;
}

function BlockChoice({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return <button className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left hover:bg-[var(--surface-strong)]" onClick={onClick}><div className="font-bold">{title}</div><p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p></button>;
}

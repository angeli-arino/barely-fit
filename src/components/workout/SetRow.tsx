import { ArrowDown, ArrowUp, Check, ChevronDown, Circle, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Exercise, ExerciseItem, PerformedSet, SetMeasurements } from '../../types';
import { useAppState } from '../../state/AppState';
import { Button } from '../ui/Button';

const asNumber = (value: string) => value === '' ? undefined : Number(value);
const asAssistance = (value: string) => value === '' ? undefined : Number.isNaN(Number(value)) ? value : Number(value);

export function SetRow({ set, item, exercise, index, label, nextSetLabel: nextSetLabelOverride }: { set: PerformedSet; item: ExerciseItem; exercise: Exercise; index: number; label?: string; nextSetLabel?: string }) {
  const { dispatch } = useAppState();
  const [expanded, setExpanded] = useState(false);
  const updateDraft = (values: Partial<SetMeasurements>) => dispatch({ type: 'update-set-draft', itemId: item.id, setId: set.id, values });
  const load = String(set.load ?? set.targetLoad ?? '');
  const reps = String(set.reps ?? set.targetReps ?? '');
  const assistance = String(set.assistance ?? set.targetAssistance ?? '');
  const duration = String(set.durationSec ?? set.targetDurationSec ?? '');
  const distance = String(set.distanceKm ?? set.targetDistanceKm ?? '');
  const rir = String(set.rir ?? '');

  const calculatedNextSetLabel = useMemo(() => {
    const next = item.sets.slice(index + 1).find((candidate) => !candidate.completed);
    return next ? `${next.kind === 'warmup' ? 'Warm-up' : 'Working'} Set ${item.sets.indexOf(next) + 1}` : 'next Exercise';
  }, [index, item.sets]);
  const nextSetLabel = nextSetLabelOverride ?? calculatedNextSetLabel;

  const complete = () => {
    dispatch({
      type: 'complete-set',
      itemId: item.id,
      setId: set.id,
      exerciseName: exercise.name,
      restSec: item.restSec,
      nextSetLabel,
      values: {
        load: asNumber(load),
        reps: asNumber(reps),
        assistance: asAssistance(assistance),
        durationSec: asNumber(duration),
        distanceKm: asNumber(distance),
        rir: asNumber(rir),
        notes: set.notes,
      },
    });
  };

  if (set.completed) {
    const pieces = [
      set.load !== undefined ? `${set.load} kg` : null,
      set.assistance !== undefined ? `${set.assistance}${typeof set.assistance === 'number' ? ' kg assist' : ''}` : null,
      set.reps !== undefined ? `${set.reps} reps` : null,
      set.durationSec !== undefined ? `${set.durationSec} sec` : null,
      set.distanceKm !== undefined ? `${set.distanceKm} km` : null,
      set.rir !== undefined ? `RIR ${set.rir}` : null,
    ].filter(Boolean).join(' · ');
    return (
      <div className="flex min-h-14 items-center gap-3 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--success)_25%,var(--border))] bg-[color-mix(in_srgb,var(--success)_7%,var(--surface))] px-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-[var(--success)]"><Check size={17} strokeWidth={3} /></div>
        <div className="min-w-0 flex-1"><div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--text-muted)]">{label ?? (set.kind === 'warmup' ? 'Warm-up' : `Set ${index + 1}`)}</div><div className="truncate text-sm font-semibold">{pieces || 'Completed'}</div></div>
        <span className="text-xs font-bold text-[var(--text-faint)]">Saved</span>
      </div>
    );
  }

  const inputClass = 'h-12 min-w-0 w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-2 text-center text-lg font-bold tabular outline-none focus:border-[var(--accent)]';
  const labelClass = 'mb-1.5 block text-center text-[10px] font-bold uppercase tracking-[.12em] text-[var(--text-faint)]';

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[var(--text-muted)]"><Circle size={9} fill="currentColor" className={set.kind === 'warmup' ? 'text-[var(--warning)]' : 'text-[var(--accent)]'} />{label ?? (set.kind === 'warmup' ? 'Warm-up' : `Working Set ${index + 1}`)}</div>
        <button className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)]" onClick={() => setExpanded(!expanded)}>More <ChevronDown size={15} className={expanded ? 'rotate-180' : ''} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {exercise.measurementType === 'reps-load' && <><label><span className={labelClass}>{exercise.equipment.includes('Barbell') ? 'Total Load' : 'Load / side'}</span><input inputMode="decimal" className={inputClass} value={load} onChange={(event) => updateDraft({ load: asNumber(event.target.value) })} aria-label={exercise.equipment.includes('Barbell') ? 'Total Load in kilograms including the bar' : 'Load in kilograms per implement or side'} /></label><label><span className={labelClass}>Reps</span><input inputMode="numeric" className={inputClass} value={reps} onChange={(event) => updateDraft({ reps: asNumber(event.target.value) })} aria-label="Repetitions" /></label></>}
        {exercise.measurementType === 'reps-assistance' && <><label><span className={labelClass}>Assistance</span><input className={inputClass} value={assistance} onChange={(event) => updateDraft({ assistance: asAssistance(event.target.value) })} aria-label="Assistance in kilograms or band name" /></label><label><span className={labelClass}>Reps</span><input inputMode="numeric" className={inputClass} value={reps} onChange={(event) => updateDraft({ reps: asNumber(event.target.value) })} aria-label="Repetitions" /></label></>}
        {exercise.measurementType === 'reps' && <label><span className={labelClass}>Reps</span><input inputMode="numeric" className={inputClass} value={reps} onChange={(event) => updateDraft({ reps: asNumber(event.target.value) })} aria-label="Repetitions" /></label>}
        {(exercise.measurementType === 'duration' || exercise.measurementType === 'distance-duration') && <label><span className={labelClass}>Seconds</span><input inputMode="numeric" className={inputClass} value={duration} onChange={(event) => updateDraft({ durationSec: asNumber(event.target.value) })} aria-label="Duration in seconds" /></label>}
        {exercise.measurementType === 'distance-duration' && <label><span className={labelClass}>Distance km</span><input inputMode="decimal" className={inputClass} value={distance} onChange={(event) => updateDraft({ distanceKm: asNumber(event.target.value) })} aria-label="Distance in kilometres" /></label>}
        {exercise.measurementType.startsWith('reps') && <label><span className={labelClass}>RIR optional</span><input inputMode="numeric" className={inputClass} value={rir} onChange={(event) => updateDraft({ rir: asNumber(event.target.value) })} aria-label="Repetitions in reserve" /></label>}
      </div>
      {expanded && <div className="mt-3 space-y-3"><label className="text-xs font-bold uppercase tracking-[.1em] text-[var(--text-muted)]">Set notes<textarea className="mt-2 min-h-20 w-full resize-y rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-sm font-normal text-[var(--text)] outline-none focus:border-[var(--accent)]" placeholder="Grip, pain, setup, tempo…" value={set.notes ?? ''} onChange={(event) => updateDraft({ notes: event.target.value || undefined })} /></label><div className="grid grid-cols-3 gap-2"><Button size="sm" variant="ghost" disabled={index === 0} icon={<ArrowUp size={15} />} onClick={() => dispatch({ type: 'move-set', itemId: item.id, setId: set.id, direction: -1 })}>Earlier</Button><Button size="sm" variant="ghost" disabled={index === item.sets.length - 1} icon={<ArrowDown size={15} />} onClick={() => dispatch({ type: 'move-set', itemId: item.id, setId: set.id, direction: 1 })}>Later</Button><Button size="sm" variant="danger" disabled={item.sets.length === 1} icon={<Trash2 size={15} />} onClick={() => dispatch({ type: 'remove-set', itemId: item.id, setId: set.id })}>Remove</Button></div></div>}
      <Button className="mt-3" variant="primary" size="lg" full onClick={complete} icon={<Check size={21} strokeWidth={3} />}>Complete Set</Button>
      <p className="mt-2 text-center text-[11px] text-[var(--text-faint)]">Set Targets remain targets until this action is pressed. Edits are saved locally.</p>
    </div>
  );
}

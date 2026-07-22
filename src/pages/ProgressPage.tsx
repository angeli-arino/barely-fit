import * as Tabs from '@radix-ui/react-tabs';
import { Award, ChevronDown, Clock3, Dumbbell, Gauge, Search, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TrendChart } from '../components/charts/TrendChart';
import { Surface } from '../components/ui/Surface';
import { Sheet } from '../components/ui/Sheet';
import { useAppState } from '../state/AppState';
import { formatDate } from '../lib';

export function ProgressPage() {
  const { workouts, exercises } = useAppState();
  const [exerciseId, setExerciseId] = useState('back-squat');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedExercise = exercises.find((exercise) => exercise.id === exerciseId)!;

  const history = useMemo(() => workouts.filter((workout) => workout.status === 'completed').flatMap((workout) => workout.blocks.flatMap((block) => block.exercises.filter((item) => item.exerciseId === exerciseId).map((item) => ({ workout, item })))).sort((a, b) => b.workout.date.localeCompare(a.workout.date)), [exerciseId, workouts]);
  const workingSets = history.flatMap(({ workout, item }) => item.sets.filter((set) => set.completed && set.kind === 'working').map((set) => ({ ...set, date: workout.date, workoutName: workout.name })));
  const warmups = history.flatMap(({ item }) => item.sets.filter((set) => set.completed && set.kind === 'warmup'));

  const weighted = selectedExercise.measurementType === 'reps-load';
  const assisted = selectedExercise.measurementType === 'reps-assistance';
  const cardio = selectedExercise.measurementType === 'distance-duration';
  const maxLoad = Math.max(0, ...workingSets.map((set) => set.load ?? 0));
  const maxReps = Math.max(0, ...workingSets.map((set) => set.reps ?? 0));
  const maxDistance = Math.max(0, ...workingSets.map((set) => set.distanceKm ?? 0));
  const maxDuration = Math.max(0, ...workingSets.map((set) => set.durationSec ?? 0));
  const e1rm = Math.max(0, ...workingSets.map((set) => set.load && set.reps ? set.load * (1 + set.reps / 30) : 0));
  const totalVolume = workingSets.reduce((sum, set) => sum + ((set.load ?? 0) * (set.reps ?? 0)), 0);
  const assistanceValues = workingSets.map((set) => typeof set.assistance === 'number' ? set.assistance : undefined).filter((value): value is number => value !== undefined);
  const minAssistance = assistanceValues.length ? Math.min(...assistanceValues) : 0;
  const recordDate = (date?: string) => date ? formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' }) : 'No record yet';
  const maxLoadDate = workingSets.find((set) => set.load === maxLoad)?.date;
  const maxRepsDate = workingSets.find((set) => set.reps === maxReps)?.date;
  const maxDistanceDate = workingSets.find((set) => set.distanceKm === maxDistance)?.date;
  const maxDurationDate = workingSets.find((set) => set.durationSec === maxDuration)?.date;
  const e1rmDate = workingSets.find((set) => set.load && set.reps && set.load * (1 + set.reps / 30) === e1rm)?.date;

  const chartPoints = history.slice().reverse().map(({ workout, item }) => {
    const valid = item.sets.filter((set) => set.completed && set.kind === 'working');
    const value = weighted ? Math.max(0, ...valid.map((set) => set.load ?? 0)) : assisted ? Math.min(...valid.map((set) => Number(set.assistance ?? 999))) : cardio ? Math.max(0, ...valid.map((set) => set.distanceKm ?? 0)) : Math.max(0, ...valid.map((set) => set.durationSec ?? 0));
    return { label: formatDate(workout.date, { day: 'numeric', month: 'short' }).replace(' ', ' '), value: Number.isFinite(value) ? Number(value.toFixed(1)) : 0 };
  });
  const chartSummary = weighted
    ? `${selectedExercise.name} top working-set load moved from ${chartPoints[0]?.value ?? 0} kg to ${chartPoints.at(-1)?.value ?? 0} kg across ${chartPoints.length} logged workouts. Warm-up sets are excluded.`
    : cardio
      ? `${selectedExercise.name} working-set distance history includes a Personal Record of ${maxDistance} km. Duration and distance are shown separately below.`
      : `${selectedExercise.name} trend uses working sets only; ${warmups.length} warm-up sets remain visible in History but are excluded here.`;

  const exerciseIdsWithHistory = new Set(workouts
    .filter((workout) => workout.status === 'completed')
    .flatMap((workout) => workout.blocks)
    .flatMap((block) => block.exercises)
    .filter((item) => item.sets.some((set) => set.completed))
    .map((item) => item.exerciseId));
  const selectorExercises = exercises.filter((exercise) => exercise.name.toLowerCase().includes(query.toLowerCase()) && exerciseIdsWithHistory.has(exercise.id));

  return (
    <div className="space-y-6 animate-rise">
      <header><p className="text-sm font-semibold text-[var(--text-muted)]">Working sets only</p><h1 className="mt-1 text-3xl font-black tracking-[-.045em] sm:text-4xl">Progress</h1></header>

      <button className="flex min-h-16 w-full items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 text-left shadow-[var(--shadow-1)] hover:bg-[var(--surface-strong)]" onClick={() => setSelectorOpen(true)}><div className="grid size-11 place-items-center rounded-[13px] bg-[var(--accent-soft)] text-[var(--accent)]"><Dumbbell size={20} /></div><div className="min-w-0 flex-1"><div className="text-xs font-black uppercase tracking-[.11em] text-[var(--text-faint)]">Exercise</div><div className="mt-1 truncate font-bold">{selectedExercise.name}</div></div><ChevronDown size={19} className="text-[var(--text-faint)]" /></button>

      <Tabs.Root defaultValue="trend">
        <Tabs.List className="grid grid-cols-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-1" aria-label="Progress views"><Tabs.Trigger value="trend" className="min-h-11 rounded-[10px] text-sm font-bold text-[var(--text-muted)] data-[state=active]:bg-[var(--surface-strong)] data-[state=active]:text-[var(--text)]">Trend</Tabs.Trigger><Tabs.Trigger value="sets" className="min-h-11 rounded-[10px] text-sm font-bold text-[var(--text-muted)] data-[state=active]:bg-[var(--surface-strong)] data-[state=active]:text-[var(--text)]">Set history</Tabs.Trigger><Tabs.Trigger value="records" className="min-h-11 rounded-[10px] text-sm font-bold text-[var(--text-muted)] data-[state=active]:bg-[var(--surface-strong)] data-[state=active]:text-[var(--text)]">Records</Tabs.Trigger></Tabs.List>

        <Tabs.Content value="trend" className="mt-4 space-y-4 outline-none">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {weighted && <MetricCard icon={<Gauge size={18} />} label="Top load" value={maxLoad ? `${maxLoad} kg` : '—'} note="Working Set Personal Record" />}
            {weighted && <MetricCard icon={<Award size={18} />} label="Estimated 1RM" value={e1rm ? `${Math.round(e1rm)} kg` : '—'} note="Epley estimate" />}
            {assisted && <MetricCard icon={<TrendingUp size={18} />} label="Lowest assistance" value={minAssistance ? `${minAssistance} kg` : '—'} note="Less is stronger" />}
            {cardio && <MetricCard icon={<TrendingUp size={18} />} label="Longest distance" value={maxDistance ? `${maxDistance} km` : '—'} note="Working effort" />}
            {(cardio || selectedExercise.measurementType === 'duration') && <MetricCard icon={<Clock3 size={18} />} label="Longest duration" value={maxDuration ? `${Math.round(maxDuration / 60)} min` : '—'} note="Elapsed time" />}
            <MetricCard icon={<Award size={18} />} label="Repetition record" value={maxReps ? String(maxReps) : '—'} note="At any working load" />
            {weighted && <MetricCard icon={<TrendingUp size={18} />} label="Training Volume" value={totalVolume ? `${Math.round(totalVolume).toLocaleString()} kg` : '—'} note="Selected Workout History" />}
          </div>
          <Surface className="p-4 sm:p-5"><div className="mb-4"><div className="text-xs font-black uppercase tracking-[.12em] text-[var(--text-faint)]">Measurement trend</div><h2 className="mt-1 text-xl font-bold">{weighted ? 'Top working-set load' : assisted ? 'Assistance trend' : cardio ? 'Distance trend' : 'Duration trend'}</h2></div>{chartPoints.length > 1 ? <TrendChart points={chartPoints} unit={weighted || assisted ? ' kg' : cardio ? ' km' : ' sec'} summary={chartSummary} /> : <div className="grid min-h-52 place-items-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-center"><div><TrendingUp className="mx-auto text-[var(--text-faint)]" /><div className="mt-3 font-bold">More history needed</div><p className="mt-1 text-sm text-[var(--text-muted)]">Complete another working set to form a trend.</p></div></div>}</Surface>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-muted)]"><strong className="text-[var(--text)]">Progress rule:</strong> {warmups.length} warm-up sets stay in workout history but do not affect records, volume, or charts. Corrections to completed workouts recalculate this view immediately.</div>
        </Tabs.Content>

        <Tabs.Content value="sets" className="mt-4 outline-none">
          <div className="space-y-3">{history.map(({ workout, item }) => <Surface key={`${workout.id}-${item.id}`} className="overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3"><div><div className="font-bold">{formatDate(workout.date, { day: 'numeric', month: 'long', year: 'numeric' })}</div><div className="text-xs text-[var(--text-muted)]">{workout.name}</div></div><span className="text-xs font-semibold text-[var(--text-faint)]">{item.sets.filter((set) => set.completed && set.kind === 'working').length} working</span></div><div className="divide-y divide-[var(--border)]">{item.sets.filter((set) => set.completed).map((set, index) => <div key={set.id} className={`flex min-h-12 items-center gap-3 px-4 text-sm ${set.kind === 'warmup' ? 'text-[var(--text-faint)]' : ''}`}><span className="w-16 text-xs font-bold uppercase tracking-[.08em]">{set.kind === 'warmup' ? 'Warm-up' : `Set ${index + 1}`}</span><span className="flex-1 font-semibold">{[set.load !== undefined ? `${set.load} kg` : null, set.assistance !== undefined ? `${set.assistance} assist` : null, set.reps !== undefined ? `${set.reps} reps` : null, set.distanceKm !== undefined ? `${set.distanceKm} km` : null, set.durationSec !== undefined ? `${set.durationSec} sec` : null].filter(Boolean).join(' · ')}</span>{set.kind === 'warmup' && <span className="text-[10px] font-bold uppercase tracking-[.08em]">excluded</span>}</div>)}</div></Surface>)}</div>
        </Tabs.Content>

        <Tabs.Content value="records" className="mt-4 outline-none">
          <Surface className="divide-y divide-[var(--border)] overflow-hidden">{weighted && <RecordRow label="Heaviest Load" value={maxLoad ? `${maxLoad} kg` : '—'} date={recordDate(maxLoadDate)} />}{weighted && <RecordRow label="Estimated 1RM" value={e1rm ? `${Math.round(e1rm)} kg` : '—'} date={recordDate(e1rmDate)} />}<RecordRow label="Most repetitions" value={maxReps ? `${maxReps} reps` : '—'} date={recordDate(maxRepsDate)} />{cardio && <RecordRow label="Longest distance" value={maxDistance ? `${maxDistance} km` : '—'} date={recordDate(maxDistanceDate)} />}{(cardio || selectedExercise.measurementType === 'duration') && <RecordRow label="Longest duration" value={maxDuration ? `${Math.round(maxDuration / 60)} min` : '—'} date={recordDate(maxDurationDate)} />}</Surface>
        </Tabs.Content>
      </Tabs.Root>

      <Sheet open={selectorOpen} onOpenChange={setSelectorOpen} title="Choose exercise" description="Search exercises with enough working-set history to review progress.">
        <div className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3"><Search size={18} className="text-[var(--text-faint)]" /><input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search exercise" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="mt-3 space-y-2">{selectorExercises.map((exercise) => <button key={exercise.id} className={`flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left ${exercise.id === exerciseId ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--surface)]'}`} onClick={() => { setExerciseId(exercise.id); setSelectorOpen(false); }}><div className="grid size-9 place-items-center rounded-[11px] bg-[var(--surface-strong)]"><Dumbbell size={17} /></div><div className="min-w-0 flex-1"><div className="font-bold">{exercise.name}</div><div className="text-xs text-[var(--text-muted)]">{exercise.measurementType.replaceAll('-', ' + ')}</div></div></button>)}</div>
      </Sheet>
    </div>
  );
}

function MetricCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <Surface className="p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)]">{icon}{label}</div><div className="metric mt-3 text-3xl font-black">{value}</div><div className="mt-1 text-xs text-[var(--text-faint)]">{note}</div></Surface>;
}

function RecordRow({ label, value, date }: { label: string; value: string; date: string }) {
  return <div className="flex min-h-20 items-center gap-4 p-4"><div className="grid size-11 place-items-center rounded-[13px] bg-[var(--accent-soft)] text-[var(--accent)]"><Award size={20} /></div><div className="min-w-0 flex-1"><div className="font-bold">{label}</div><div className="text-sm text-[var(--text-muted)]">{date}</div></div><div className="metric text-xl font-black">{value}</div></div>;
}

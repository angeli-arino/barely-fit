import * as Tabs from '@radix-ui/react-tabs';
import { Award, ChevronDown, Clock3, Dumbbell, Gauge, Search, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TrendChart } from '../components/charts/TrendChart';
import { Surface } from '../components/ui/Surface';
import { Sheet } from '../components/ui/Sheet';
import { calculateExerciseProgress } from '../domain/progress';
import { formatDate } from '../lib';
import { useAppState } from '../state/AppState';
import type { PerformedSet } from '../types';

export function ProgressPage() {
  const { workouts, exercises } = useAppState();
  const [exerciseId, setExerciseId] = useState('back-squat');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedExercise = exercises.find((exercise) => exercise.id === exerciseId) ?? exercises[0];
  const progress = useMemo(
    () => selectedExercise ? calculateExerciseProgress(workouts, selectedExercise) : undefined,
    [selectedExercise, workouts],
  );

  const exerciseIdsWithHistory = useMemo(() => new Set(workouts
    .filter((workout) => workout.status === 'completed')
    .flatMap((workout) => workout.blocks)
    .flatMap((block) => block.exercises)
    .filter((item) => item.sets.some((set) => set.completed))
    .map((item) => item.exerciseId)), [workouts]);
  const selectorExercises = exercises.filter((exercise) => (
    exercise.name.toLowerCase().includes(query.toLowerCase())
    && exerciseIdsWithHistory.has(exercise.id)
  ));

  if (!selectedExercise || !progress) {
    return <Surface className="p-6 text-center"><h1 className="text-xl font-bold">No Workout History yet</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Complete a Workout to begin tracking Progress.</p></Surface>;
  }

  const weighted = selectedExercise.measurementType === 'reps-load';
  const assisted = selectedExercise.measurementType === 'reps-assistance';
  const cardio = selectedExercise.measurementType === 'distance-duration';
  const durationBased = cardio || selectedExercise.measurementType === 'duration';
  const minAssistance = progress.workingSets.reduce<number | undefined>((minimum, { set }) => (
    typeof set.assistance !== 'number' ? minimum : Math.min(minimum ?? set.assistance, set.assistance)
  ), undefined);
  const recordDate = (date?: string) => date
    ? formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No record yet';
  const chartPoints = progress.trend.points.map(({ date, value }) => ({
    label: formatDate(date, { day: 'numeric', month: 'short' }),
    value,
  }));
  return (
    <div className="space-y-6 animate-rise">
      <header><p className="text-sm font-semibold text-[var(--text-muted)]">Working Sets build Progress</p><h1 className="mt-1 text-3xl font-black tracking-[-.045em] sm:text-4xl">Progress</h1></header>

      <button className="flex min-h-16 w-full items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 text-left shadow-[var(--shadow-1)] hover:bg-[var(--surface-strong)]" onClick={() => setSelectorOpen(true)}><div className="grid size-11 place-items-center rounded-[13px] bg-[var(--accent-soft)] text-[var(--accent)]"><Dumbbell size={20} /></div><div className="min-w-0 flex-1"><div className="text-xs font-black uppercase tracking-[.11em] text-[var(--text-faint)]">Exercise</div><div className="mt-1 truncate font-bold">{selectedExercise.name}</div></div><ChevronDown size={19} className="text-[var(--text-faint)]" /></button>

      <Tabs.Root defaultValue="trend">
        <Tabs.List className="grid grid-cols-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-1" aria-label="Progress views"><Tabs.Trigger value="trend" className="min-h-11 rounded-[10px] text-sm font-bold text-[var(--text-muted)] data-[state=active]:bg-[var(--surface-strong)] data-[state=active]:text-[var(--text)]">Trend</Tabs.Trigger><Tabs.Trigger value="sets" className="min-h-11 rounded-[10px] text-sm font-bold text-[var(--text-muted)] data-[state=active]:bg-[var(--surface-strong)] data-[state=active]:text-[var(--text)]">Workout history</Tabs.Trigger><Tabs.Trigger value="records" className="min-h-11 rounded-[10px] text-sm font-bold text-[var(--text-muted)] data-[state=active]:bg-[var(--surface-strong)] data-[state=active]:text-[var(--text)]">Records</Tabs.Trigger></Tabs.List>

        <Tabs.Content value="trend" className="mt-4 space-y-4 outline-none">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {weighted && <MetricCard icon={<Gauge size={18} />} label="Top Load" value={progress.records.load ? `${progress.records.load.value} kg` : '—'} note="Working Set Personal Record" />}
            {weighted && <MetricCard icon={<Award size={18} />} label="Estimated 1RM" value={progress.estimatedOneRepMax ? `${Math.round(progress.estimatedOneRepMax.value)} kg` : '—'} note="Eligible 1–10 rep Working Sets" />}
            {assisted && <MetricCard icon={<TrendingUp size={18} />} label="Lowest assistance" value={minAssistance !== undefined ? `${minAssistance} kg` : '—'} note="Less assistance is stronger" />}
            {cardio && <MetricCard icon={<TrendingUp size={18} />} label="Longest distance" value={progress.records.distance ? `${progress.records.distance.value} km` : '—'} note="Working Set Personal Record" />}
            {durationBased && <MetricCard icon={<Clock3 size={18} />} label="Longest duration" value={progress.records.duration ? `${Math.round(progress.records.duration.value / 60)} min` : '—'} note="Working Set Personal Record" />}
            {progress.records.repetitions && <MetricCard icon={<Award size={18} />} label="Repetition record" value={String(progress.records.repetitions.value)} note="Working Set Personal Record" />}
            {weighted && <MetricCard icon={<TrendingUp size={18} />} label="Training Volume" value={progress.trainingVolume ? `${Math.round(progress.trainingVolume).toLocaleString()} kg` : '—'} note="Selected Exercise in Workout History" />}
          </div>

          <Surface className="p-4 sm:p-5">
            <div className="mb-4"><div className="text-xs font-black uppercase tracking-[.12em] text-[var(--text-faint)]">Measurement trend</div><h2 className="mt-1 text-xl font-bold">{progress.trend.label}</h2></div>
            {progress.trend.state === 'ready'
              ? <TrendChart points={chartPoints} unit={progress.trend.unit} summary={progress.trend.summary} />
              : <div className="grid min-h-52 place-items-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] px-4 text-center" role="status"><div><TrendingUp className="mx-auto text-[var(--text-faint)]" /><div className="mt-3 font-bold">{progress.trend.state === 'empty' ? 'No Working Set history yet' : 'More history needed'}</div><p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">{progress.trend.summary}</p></div></div>}
          </Surface>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-muted)]">
            <p><strong className="text-[var(--text)]">Estimated 1RM:</strong> Epley formula, Load × (1 + repetitions ÷ 30), for completed weighted Working Sets of 1–10 repetitions.</p>
            <p className="mt-2"><strong className="text-[var(--text)]">Training Volume:</strong> Load × repetitions × implements. Dumbbells count twice; barbell Load already includes the bar; machine and cable Load counts once.</p>
            <p className="mt-2"><strong className="text-[var(--text)]">Warm-ups:</strong> {progress.warmupSets.length} visible in History and excluded from records, e1RM, volume, and charts. Completed Workout edits and deletions recalculate immediately.</p>
          </div>
        </Tabs.Content>

        <Tabs.Content value="sets" className="mt-4 outline-none">
          {progress.history.length === 0
            ? <Surface className="p-6 text-center"><div className="font-bold">No completed Sets yet</div><p className="mt-1 text-sm text-[var(--text-muted)]">Complete this Exercise in a Workout to begin its History.</p></Surface>
            : <div className="space-y-3">{progress.history.map((entry) => <Surface key={`${entry.workoutId}-${entry.itemId}`} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3"><div><div className="font-bold">{formatDate(entry.date, { day: 'numeric', month: 'long', year: 'numeric' })}</div><div className="text-xs text-[var(--text-muted)]">{entry.workoutName}</div></div><span className="text-xs font-semibold text-[var(--text-faint)]">{entry.workingSets.length} contributing</span></div>
              {entry.workingSets.length > 0 && <SetGroup title="Working Sets · contribute to Progress" sets={entry.workingSets} />}
              {entry.warmupSets.length > 0 && <SetGroup title="Warm-up Sets · excluded from Progress" sets={entry.warmupSets} warmup />}
            </Surface>)}</div>}
        </Tabs.Content>

        <Tabs.Content value="records" className="mt-4 outline-none">
          <Surface className="divide-y divide-[var(--border)] overflow-hidden">
            {weighted && <RecordRow label="Heaviest Load" value={progress.records.load ? `${progress.records.load.value} kg` : '—'} date={recordDate(progress.records.load?.date)} />}
            {weighted && <RecordRow label="Estimated 1RM" value={progress.estimatedOneRepMax ? `${Math.round(progress.estimatedOneRepMax.value)} kg` : '—'} date={recordDate(progress.estimatedOneRepMax?.date)} />}
            {progress.records.repetitions && <RecordRow label="Most repetitions" value={`${progress.records.repetitions.value} reps`} date={recordDate(progress.records.repetitions.date)} />}
            {cardio && <RecordRow label="Longest distance" value={progress.records.distance ? `${progress.records.distance.value} km` : '—'} date={recordDate(progress.records.distance?.date)} />}
            {durationBased && <RecordRow label="Longest duration" value={progress.records.duration ? `${Math.round(progress.records.duration.value / 60)} min` : '—'} date={recordDate(progress.records.duration?.date)} />}
          </Surface>
        </Tabs.Content>
      </Tabs.Root>

      <Sheet open={selectorOpen} onOpenChange={setSelectorOpen} title="Choose exercise" description="Search Exercises with completed Sets in Workout History.">
        <div className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3"><Search size={18} className="text-[var(--text-faint)]" /><input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search Exercise" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="mt-3 space-y-2">{selectorExercises.map((exercise) => <button key={exercise.id} className={`flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left ${exercise.id === selectedExercise.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--surface)]'}`} onClick={() => { setExerciseId(exercise.id); setSelectorOpen(false); }}><div className="grid size-9 place-items-center rounded-[11px] bg-[var(--surface-strong)]"><Dumbbell size={17} /></div><div className="min-w-0 flex-1"><div className="font-bold">{exercise.name}</div><div className="text-xs text-[var(--text-muted)]">{exercise.measurementType.replaceAll('-', ' + ')}</div></div></button>)}</div>
      </Sheet>
    </div>
  );
}

function SetGroup({ title, sets, warmup = false }: { title: string; sets: PerformedSet[]; warmup?: boolean }) {
  return <section className={warmup ? 'bg-[var(--surface-strong)]/50' : ''}><h3 className="border-b border-[var(--border)] px-4 py-2 text-[11px] font-black uppercase tracking-[.09em] text-[var(--text-faint)]">{title}</h3><div className="divide-y divide-[var(--border)]">{sets.map((set, index) => <div key={set.id} className={`flex min-h-12 items-center gap-3 px-4 text-sm ${warmup ? 'text-[var(--text-faint)]' : ''}`}><span className="w-16 text-xs font-bold uppercase tracking-[.08em]">{warmup ? `Warm-up ${index + 1}` : `Set ${index + 1}`}</span><span className="flex-1 font-semibold">{formatSet(set)}</span>{warmup && <span className="text-[10px] font-bold uppercase tracking-[.08em]">excluded</span>}</div>)}</div></section>;
}

function formatSet(set: PerformedSet): string {
  return [
    set.load !== undefined ? `${set.load} kg` : null,
    set.assistance !== undefined ? `${set.assistance} assist` : null,
    set.reps !== undefined ? `${set.reps} reps` : null,
    set.distanceKm !== undefined ? `${set.distanceKm} km` : null,
    set.durationSec !== undefined ? `${set.durationSec} sec` : null,
  ].filter(Boolean).join(' · ');
}

function MetricCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <Surface className="p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)]">{icon}{label}</div><div className="metric mt-3 text-3xl font-black">{value}</div><div className="mt-1 text-xs text-[var(--text-faint)]">{note}</div></Surface>;
}

function RecordRow({ label, value, date }: { label: string; value: string; date: string }) {
  return <div className="flex min-h-20 items-center gap-4 p-4"><div className="grid size-11 place-items-center rounded-[13px] bg-[var(--accent-soft)] text-[var(--accent)]"><Award size={20} /></div><div className="min-w-0 flex-1"><div className="font-bold">{label}</div><div className="text-sm text-[var(--text-muted)]">{date}</div></div><div className="metric text-xl font-black">{value}</div></div>;
}

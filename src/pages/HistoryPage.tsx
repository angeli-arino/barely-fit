import { CalendarCheck, ChevronRight, Clock3, Dumbbell, Search, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { countCompletedWorkingSets, formatDate } from '../lib';
import { Surface } from '../components/ui/Surface';
import { chronologicalCompletedWorkouts } from '../domain/workoutHistory';

function workoutVolume(workout: import('../types').Workout) {
  return workout.blocks.flatMap((block) => block.exercises).flatMap((item) => item.sets).filter((set) => set.completed && set.kind === 'working').reduce((sum, set) => sum + ((set.load ?? 0) * (set.reps ?? 0)), 0);
}

export function HistoryPage() {
  const { workouts, exercises, syncState } = useAppState();
  const [query, setQuery] = useState('');
  const completed = chronologicalCompletedWorkouts(workouts);
  const totalMinutes = completed.reduce((sum, workout) => sum + (workout.durationMin ?? 0), 0);
  const totalVolume = completed.reduce((sum, workout) => sum + workoutVolume(workout), 0);
  const visible = completed.filter((workout) => {
    const haystack = [workout.name, ...workout.blocks.flatMap((block) => block.exercises.map((item) => exercises.find((exercise) => exercise.id === item.exerciseId)?.name ?? item.exerciseId))].join(' ').toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  return (
    <div className="space-y-6 animate-rise">
      <header><p className="text-sm font-semibold text-[var(--text-muted)]">Completed Workouts</p><h1 className="mt-1 text-3xl font-black tracking-[-.045em] sm:text-4xl">Workout History</h1></header>
      <div className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3"><Search size={18} className="text-[var(--text-faint)]" /><input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--text-faint)]" placeholder="Search workout or exercise" aria-label="Search workout history" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <Surface className="grid grid-cols-3 divide-x divide-[var(--border)] overflow-hidden"><div className="p-4 text-center"><div className="metric text-2xl font-black">{completed.length}</div><div className="mt-1 text-xs text-[var(--text-faint)]">Workouts</div></div><div className="p-4 text-center"><div className="metric text-2xl font-black">{totalMinutes}</div><div className="mt-1 text-xs text-[var(--text-faint)]">minutes</div></div><div className="p-4 text-center"><div className="metric text-2xl font-black">{(totalVolume / 1000).toFixed(1)}t</div><div className="mt-1 text-xs text-[var(--text-faint)]">Training Volume</div></div></Surface>
      <div className="space-y-3">
        {visible.map((workout) => {
          const sets = countCompletedWorkingSets(workout.blocks);
          const volume = workoutVolume(workout);
          const exercises = workout.blocks.reduce((sum, block) => sum + block.exercises.length, 0);
          return (
            <Link key={workout.id} to={`/history/${workout.id}`} className="block rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)] sm:p-5">
              <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-[var(--surface-strong)] text-[var(--text-muted)]"><Dumbbell size={21} /></div><div className="min-w-0 flex-1"><div className="text-xs font-black uppercase tracking-[.11em] text-[var(--text-faint)]">{formatDate(workout.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div><h2 className="mt-1 text-lg font-bold">{workout.name}</h2><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]"><span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{workout.durationMin} min</span><span>{exercises} exercises</span><span>{sets} working sets</span></div></div><ChevronRight size={19} className="mt-2 shrink-0 text-[var(--text-faint)]" /></div>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-4 text-sm"><div className="flex items-center gap-2 text-[var(--text-muted)]"><TrendingUp size={16} /><span>{volume ? `${volume.toLocaleString()} kg volume` : 'Cardio + bodyweight'}</span></div><div className="flex items-center justify-end gap-2 text-[var(--text-muted)]"><CalendarCheck size={16} /><span>{syncState === 'synced' ? 'Synced' : syncState === 'offline' ? 'Saved offline' : syncState === 'error' ? 'Sync retry needed' : 'Syncing'}</span></div></div>
            </Link>
          );
        })}
      </div>
      {!visible.length && <Surface className="p-8 text-center"><div className="font-bold">No matching Workouts</div><p className="mt-2 text-sm text-[var(--text-muted)]">Search by Workout or Exercise name.</p></Surface>}
    </div>
  );
}

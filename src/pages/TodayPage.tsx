import { ArrowRight, CalendarClock, CloudOff, Dumbbell, Gauge, Moon, Play, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Surface } from '../components/ui/Surface';
import { Button } from '../components/ui/Button';
import { useAppState } from '../state/AppState';
import { countCompletedWorkingSets, countTargetWorkingSets, formatSeconds } from '../lib';

export function TodayPage() {
  const { activeWorkout, workouts, templates, todayScenario, dispatch, syncState } = useAppState();
  const navigate = useNavigate();
  const todayPlannedWorkout = workouts.find((workout) => workout.date === '2026-07-23' && workout.status === 'planned');
  const showActive = activeWorkout;
  const completed = activeWorkout ? countCompletedWorkingSets(activeWorkout.blocks) : 0;
  const total = activeWorkout ? countTargetWorkingSets(activeWorkout.blocks) : 0;
  const activeDuration = activeWorkout?.startedAt ? Math.max(0, Math.floor((Date.now() - new Date(activeWorkout.startedAt).getTime()) / 1000)) : 0;
  const completedWorkouts = workouts.filter((workout) => workout.status === 'completed');
  const completedSets = completedWorkouts.flatMap((workout) => workout.blocks.flatMap((block) => block.exercises.flatMap((item) => item.sets
    .filter((set) => set.kind === 'working' && set.completed)
    .map((set) => ({ workout, exerciseId: item.exerciseId, set })))));
  const squatSets = completedSets.filter((entry) => entry.exerciseId === 'back-squat' && entry.set.load != null && entry.set.reps != null);
  const topSquatSet = [...squatSets].sort((a, b) => (b.set.load! - a.set.load!) || (b.set.reps! - a.set.reps!))[0];
  const julySquatLoads = squatSets.filter((entry) => entry.workout.date.startsWith('2026-07')).map((entry) => entry.set.load!);
  const squatGain = julySquatLoads.length ? Math.max(...julySquatLoads) - Math.min(...julySquatLoads) : 0;
  const fourWeekVolume = completedSets
    .filter((entry) => entry.workout.date >= '2026-06-26' && entry.workout.date <= '2026-07-23')
    .reduce((sum, entry) => sum + ((entry.set.load ?? 0) * (entry.set.reps ?? 0)), 0);
  const recentRun = completedSets
    .filter((entry) => entry.exerciseId === 'easy-run' && entry.set.distanceKm != null)
    .sort((a, b) => b.workout.date.localeCompare(a.workout.date))[0];
  const startWorkout = (templateId: string) => {
    dispatch({ type: 'start-template', templateId });
    navigate('/workout/active');
  };

  return (
    <div className="space-y-7 animate-rise">
      <section>
        <p className="text-sm font-semibold text-[var(--text-muted)]">Thursday, 23 July</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-.045em] sm:text-4xl">Today</h1>
      </section>

      {showActive && (
        <Surface className="overflow-hidden border-[color-mix(in_srgb,var(--accent)_45%,var(--border))]">
          <div className="h-1 bg-[var(--border)]"><div className="h-full bg-[var(--accent)]" style={{ width: `${Math.max(8, (completed / Math.max(1, total)) * 100)}%` }} /></div>
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-black uppercase tracking-[.11em] text-[var(--accent)]"><Play size={14} fill="currentColor" /> Active workout</span>
              <span className="metric text-sm font-bold text-[var(--text-muted)]">{formatSeconds(activeDuration)}</span>
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-[-.035em]">{showActive.name}</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{completed} of {total} Working Sets complete · every edit recovered from offline storage</p>
            <Button className="mt-5" variant="primary" size="lg" full onClick={() => navigate('/workout/active')} icon={<RotateCcw size={19} />}>Resume workout</Button>
          </div>
        </Surface>
      )}

      {todayScenario === 'planned' && todayPlannedWorkout && (
        <Surface className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[var(--accent-soft)] text-[var(--accent)]"><CalendarClock size={21} /></div>
            <div className="min-w-0 flex-1"><div className="text-xs font-black uppercase tracking-[.12em] text-[var(--text-muted)]">Planned today · 6:30 pm</div><h2 className="mt-1 text-xl font-bold">{todayPlannedWorkout.name}</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Ready from your Workout Schedule</p></div>
          </div>
          <Button className="mt-5" variant="primary" size="lg" full onClick={() => { dispatch({ type: 'start-planned-workout', workoutId: todayPlannedWorkout.id }); navigate('/workout/active'); }} icon={<Play size={18} />}>Start planned workout</Button>
          <div className="mt-2 grid grid-cols-2 gap-2"><Button variant="ghost" onClick={() => navigate('/plan')}>Move</Button><Button variant="ghost" onClick={() => navigate('/plan')}>Edit schedule</Button></div>
        </Surface>
      )}

      {todayScenario === 'rest' && (
        <Surface className="p-5 sm:p-6">
          <div className="grid size-12 place-items-center rounded-[14px] bg-[var(--surface-strong)] text-[var(--text-muted)]"><Moon size={22} /></div>
          <h2 className="mt-5 text-2xl font-black tracking-[-.035em]">Rest day</h2>
          <p className="mt-2 leading-7 text-[var(--text-muted)]">Nothing is planned. Your next Planned Workout is Heavy Legs tomorrow. You can still quick-start without changing the plan.</p>
        </Surface>
      )}

      {(todayScenario === 'empty' || (todayScenario === 'planned' && !todayPlannedWorkout)) && !showActive && (
        <Surface className="border-dashed p-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-[14px] bg-[var(--surface-strong)] text-[var(--text-muted)]"><Sparkles size={22} /></div>
          <h2 className="mt-4 text-xl font-bold">A clear training day</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">No Active Workout, Planned Workout, or recent Workout needs attention.</p>
        </Surface>
      )}

      {syncState === 'offline' && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
          <CloudOff className="mt-0.5 shrink-0 text-[var(--text-muted)]" size={18} />
          <div><div className="font-bold">Offline is okay</div><p className="mt-1 leading-6 text-[var(--text-muted)]">Keep logging normally. Changes save immediately on this device and sync when the connection returns.</p></div>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--text-faint)]">Start something</p><h2 className="mt-1 text-xl font-bold">Quick start</h2></div><Link to="/templates" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-[var(--accent)]">All templates <ArrowRight size={16} /></Link></div>
        <div className="grid gap-3 md:grid-cols-3">
          {templates.map((template) => (
            <button key={template.id} className="min-h-28 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-1)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]" onClick={() => startWorkout(template.id)}>
              <div className="flex items-start justify-between"><div className="grid size-10 place-items-center rounded-[12px] bg-[var(--surface-strong)] text-[var(--text-muted)]"><Dumbbell size={19} /></div><Plus size={18} className="text-[var(--text-faint)]" /></div>
              <div className="mt-4 font-bold">{template.name}</div><div className="mt-1 text-sm text-[var(--text-muted)]">{template.estimatedMin} min · {template.focus}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--text-faint)]">Recent progress</p><h2 className="mt-1 text-xl font-bold">Quiet momentum</h2></div>
        <Surface className="grid divide-y divide-[var(--border)] overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)]"><Gauge size={17} /> Squat top set</div><div className="metric mt-3 text-3xl font-black">{topSquatSet ? `${topSquatSet.set.load} kg × ${topSquatSet.set.reps}` : 'No data'}</div><div className="mt-1 text-xs font-semibold text-[var(--success)]">{squatGain > 0 ? `+${squatGain} kg this month` : 'From completed Working Sets'}</div></div>
          <div className="p-4"><div className="text-sm font-semibold text-[var(--text-muted)]">Four-week volume</div><div className="metric mt-3 text-3xl font-black">{Math.round(fourWeekVolume).toLocaleString('en-NZ')} kg</div><div className="mt-1 text-xs text-[var(--text-faint)]">Completed Working Sets only</div></div>
          <div className="p-4"><div className="text-sm font-semibold text-[var(--text-muted)]">Recent run</div><div className="metric mt-3 text-3xl font-black">{recentRun ? `${recentRun.set.distanceKm} km` : 'No data'}</div><div className="mt-1 text-xs text-[var(--text-faint)]">{recentRun?.workout.name ?? 'Complete a run to begin'}</div></div>
        </Surface>
      </section>

      <p className="text-center text-xs text-[var(--text-faint)]">Prototype scenarios can be changed in <Link className="font-bold text-[var(--text-muted)] underline underline-offset-4" to="/settings">Settings</Link>.</p>
    </div>
  );
}

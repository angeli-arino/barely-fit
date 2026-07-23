import type { Exercise, ExerciseBlock, RestTimerState } from '../types';

export function remainingTimerSeconds(timer: RestTimerState, nowMs: number): number {
  if (!timer.active) return 0;
  if (timer.paused || !timer.deadlineAt) return timer.remainingSec;
  return Math.max(0, Math.ceil((timer.deadlineAt - nowMs) / 1000));
}

export function startRestTimer(timer: RestTimerState, seconds: number, nowMs: number, exerciseName: string, nextSetLabel?: string, notificationJobId = `rest-${nowMs}`): RestTimerState {
  return { ...timer, active: seconds > 0, initialSec: seconds, remainingSec: seconds, deadlineAt: seconds > 0 ? nowMs + seconds * 1000 : undefined, paused: false, exerciseName, nextSetLabel, notificationJobId: seconds > 0 ? notificationJobId : undefined, cancelledNotificationJobId: timer.notificationJobId, endedBy: undefined };
}

export function tickRestTimer(timer: RestTimerState, nowMs: number): RestTimerState {
  const remainingSec = remainingTimerSeconds(timer, nowMs);
  return remainingSec === 0 ? { ...timer, active: false, remainingSec: 0, deadlineAt: undefined, endedBy: 'expired' } : { ...timer, remainingSec };
}

export function adjustRestTimer(timer: RestTimerState, seconds: number, nowMs: number): RestTimerState {
  const remainingSec = Math.max(0, remainingTimerSeconds(timer, nowMs) + seconds);
  return remainingSec === 0 ? { ...timer, active: false, remainingSec: 0, deadlineAt: undefined, endedBy: 'dismissed' } : { ...timer, active: true, remainingSec, deadlineAt: timer.paused ? undefined : nowMs + remainingSec * 1000 };
}

export function toggleRestTimerPause(timer: RestTimerState, nowMs: number): RestTimerState {
  if (timer.paused) return { ...timer, paused: false, deadlineAt: nowMs + timer.remainingSec * 1000 };
  const remainingSec = remainingTimerSeconds(timer, nowMs);
  return remainingSec === 0 ? { ...timer, active: false, remainingSec: 0, deadlineAt: undefined, endedBy: 'expired' } : { ...timer, paused: true, remainingSec, deadlineAt: undefined };
}

export function dismissRestTimer(timer: RestTimerState): RestTimerState {
  return { ...timer, active: false, remainingSec: 0, deadlineAt: undefined, paused: false, endedBy: 'dismissed' };
}

export function workoutDurationMinutes(startedAt: string | undefined, completedAtMs: number): number {
  if (!startedAt) return 1;
  return Math.max(1, Math.round((completedAtMs - new Date(startedAt).getTime()) / 60_000));
}

export function nextRelevantSetLabel(blocks: ExerciseBlock[], currentSetId: string, exercises: Exercise[]): string {
  const ordered = blocks.flatMap((block) => {
    if (block.type === 'single') {
      return block.exercises.flatMap((item) => item.sets.map((set, setIndex) => ({ item, set, setIndex })));
    }
    const rounds = Math.max(block.rounds ?? 0, ...block.exercises.map((item) => item.sets.length));
    return Array.from({ length: rounds }, (_, roundIndex) => block.exercises.flatMap((item) => {
      const set = item.sets[roundIndex];
      return set ? [{ item, set, setIndex: roundIndex }] : [];
    })).flat();
  });
  const currentIndex = ordered.findIndex(({ set }) => set.id === currentSetId);
  const next = ordered.slice(currentIndex + 1).find(({ set }) => !set.completed);
  if (!next) return 'Workout complete';
  const exercise = exercises.find(({ id }) => id === next.item.exerciseId);
  return `${exercise?.name ?? 'Exercise'} · ${next.set.kind === 'warmup' ? 'Warm-up' : `Working Set ${next.setIndex + 1}`}`;
}

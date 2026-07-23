import type { SyncState, Workout } from '../types';

export function recoveredHistorySyncState(hasLocalState: boolean, remoteUnavailable: boolean, hasRemoteState: boolean, online: boolean): SyncState {
  if (hasLocalState) return online ? 'syncing' : 'offline';
  if (remoteUnavailable) return 'offline';
  return hasRemoteState ? 'synced' : 'syncing';
}

export function chooseRecoveredHistory(local: { updatedAt: string; pending: boolean } | undefined, remoteUpdatedAt: string | undefined): 'local' | 'remote' | undefined {
  if (!local) return remoteUpdatedAt ? 'remote' : undefined;
  if (local.pending || !remoteUpdatedAt || local.updatedAt >= remoteUpdatedAt) return 'local';
  return 'remote';
}

export function chronologicalCompletedWorkouts(workouts: Workout[]): Workout[] {
  return workouts
    .filter((workout) => workout.status === 'completed')
    .sort((left, right) => right.date.localeCompare(left.date) || (right.completedAt ?? '').localeCompare(left.completedAt ?? ''));
}

export function validateCompletedWorkout(workout: Workout): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workout.date)) return 'Choose a valid Workout date.';
  const [year, month, day] = workout.date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) return 'Choose a valid Workout date.';
  if (!workout.name.trim()) return 'Workout name is required.';
  if (!workout.blocks.length || workout.blocks.some((block) => !block.exercises.length)) return 'A completed Workout must contain at least one performed Exercise.';
  if (workout.blocks.some((block) => block.type === 'single' && block.exercises.length !== 1)) return 'A single Exercise Block must contain exactly one Exercise.';
  if (workout.blocks.some((block) => block.type === 'paired' && block.exercises.length !== 2)) return 'A paired Exercise Block must contain exactly two Exercises.';
  if (workout.blocks.some((block) => block.type === 'rounds' && (block.exercises.length < 2 || !Number.isInteger(block.rounds) || (block.rounds ?? 0) < 1))) return 'A rounds Exercise Block needs multiple Exercises and a valid round count.';
  if (!workout.blocks.flatMap((block) => block.exercises).some((item) => item.sets.some((set) => set.completed))) return 'A completed Workout must contain at least one performed Set.';
  const numbers = workout.blocks.flatMap((block) => block.exercises).flatMap((item) => item.sets)
    .flatMap((set) => [set.load, typeof set.assistance === 'number' ? set.assistance : undefined, set.reps, set.durationSec, set.distanceKm, set.rir])
    .filter((value): value is number => value !== undefined);
  if (numbers.some((value) => !Number.isFinite(value) || value < 0)) return 'Set measurements must be finite, non-negative numbers.';
  return undefined;
}

export function correctCompletedWorkout(workouts: Workout[], corrected: Workout, memberId: string): { workouts: Workout[]; corrected: boolean; error?: string } {
  const current = workouts.find((workout) => workout.id === corrected.id && workout.memberId === memberId && workout.status === 'completed');
  if (!current) return { workouts, corrected: false, error: 'Only your own completed Workout can be corrected.' };
  const error = validateCompletedWorkout(corrected);
  if (error) return { workouts, corrected: false, error };
  return {
    corrected: true,
    workouts: workouts.map((workout) => workout !== current ? workout : ({
      ...corrected,
      id: current.id,
      memberId: current.memberId,
      status: 'completed',
      completedAt: current.completedAt,
    })),
  };
}

export function deleteCompletedWorkout(workouts: Workout[], workoutId: string, memberId: string): { workouts: Workout[]; deletedWorkout?: Workout } {
  const deletedWorkout = workouts.find((workout) => workout.id === workoutId && workout.memberId === memberId && workout.status === 'completed');
  if (!deletedWorkout) return { workouts };
  return { workouts: workouts.filter((workout) => workout !== deletedWorkout), deletedWorkout };
}

export function restoreDeletedWorkout(workouts: Workout[], deletedWorkout?: Workout): Workout[] {
  if (!deletedWorkout || workouts.some((workout) => workout.id === deletedWorkout.id && workout.memberId === deletedWorkout.memberId)) return workouts;
  return [...workouts, deletedWorkout];
}

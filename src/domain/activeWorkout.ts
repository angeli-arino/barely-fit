import type { ExerciseItem, PerformedSet, Workout, WorkoutTemplate } from '../types';

const copySetForTemplate = (set: PerformedSet): PerformedSet => ({
  ...set,
  targetLoad: set.load ?? set.targetLoad,
  targetReps: set.reps ?? set.targetReps,
  targetAssistance: set.assistance ?? set.targetAssistance,
  targetDurationSec: set.durationSec ?? set.targetDurationSec,
  targetDistanceKm: set.distanceKm ?? set.targetDistanceKm,
  load: undefined,
  reps: undefined,
  assistance: undefined,
  durationSec: undefined,
  distanceKm: undefined,
  notes: undefined,
  completed: false,
  completedAt: undefined,
});

export function moveExerciseBlock(workout: Workout, blockId: string, direction: -1 | 1): Workout {
  const blocks = [...workout.blocks];
  const index = blocks.findIndex((block) => block.id === blockId);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= blocks.length) return workout;
  [blocks[index], blocks[next]] = [blocks[next], blocks[index]];
  return { ...workout, blocks };
}

export function replaceExerciseInWorkout(workout: Workout, itemId: string, exerciseId: string, restSec: number, replacementItemId: string): Workout {
  return {
    ...workout,
    blocks: workout.blocks.map((block) => ({
      ...block,
      exercises: block.exercises.flatMap((item) => {
        if (item.id !== itemId) return [item];
        const completed = item.sets.filter((set) => set.completed);
        const remaining = item.sets.filter((set) => !set.completed);
        if (completed.length === 0) return [{ ...item, exerciseId, restSec, priorSummary: 'No prior performance for this replacement' }];
        if (remaining.length === 0) return [item];
        return [
          { ...item, sets: completed },
          { ...item, id: replacementItemId, exerciseId, restSec, sets: remaining, priorSummary: 'No prior performance for this replacement' },
        ];
      }),
    })),
  };
}

export function addSetToExercise(workout: Workout, itemId: string, setId: string): Workout {
  return {
    ...workout,
    blocks: workout.blocks.map((block) => ({
      ...block,
      exercises: block.exercises.map((item) => {
        if (item.id !== itemId) return item;
        const previous = item.sets.at(-1);
        if (!previous) return item;
        return { ...item, sets: [...item.sets, { ...previous, id: setId, completed: false, completedAt: undefined }] };
      }),
    })),
  };
}

export function addExerciseToBlock(workout: Workout, blockId: string, item: ExerciseItem): Workout {
  return {
    ...workout,
    blocks: workout.blocks.map((block) => block.id === blockId ? { ...block, exercises: [...block.exercises, item] } : block),
  };
}

export function updateTemplateFromWorkout(template: WorkoutTemplate, workout: Workout, updatedAt: string): WorkoutTemplate {
  return {
    ...template,
    name: workout.name,
    blocks: workout.blocks.map((block) => ({
      ...block,
      exercises: block.exercises.map((item) => ({ ...item, sets: item.sets.map(copySetForTemplate) })),
    })),
    updatedAt,
  };
}

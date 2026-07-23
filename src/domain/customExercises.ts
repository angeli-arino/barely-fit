import type { Exercise, MeasurementType, Workout } from '../types';

export interface CustomExerciseInput {
  name: string;
  measurementType: MeasurementType;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string[];
  instructions?: string[];
  defaultRestSec?: number;
}

export function createCustomExercise(input: CustomExerciseInput, memberId: string, id: string): Exercise {
  const name = input.name.trim();
  if (!name) throw new Error('Give the Custom Exercise a name.');
  return { id, name, measurementType: input.measurementType, primaryMuscles: input.primaryMuscles ?? [], secondaryMuscles: input.secondaryMuscles ?? [], equipment: input.equipment ?? [], instructions: input.instructions ?? [], defaultRestSec: input.defaultRestSec, custom: true, createdByMemberId: memberId, placeholderLabel: 'Private Custom Exercise placeholder', provenance: { source: 'Private Member', sourceId: id, author: 'Private Member', license: 'Private use only', snapshotDate: new Date().toISOString().slice(0, 10), modified: false, reviewStatus: 'private' } };
}

export function updateCustomExercise(exercise: Exercise, input: CustomExerciseInput, memberId: string): Exercise {
  if (!exercise.custom || exercise.createdByMemberId !== memberId) throw new Error('Only the creating Member can edit this Custom Exercise.');
  return { ...createCustomExercise(input, memberId, exercise.id), provenance: exercise.provenance };
}

export function canDeleteCustomExercise(exercise: Exercise, workouts: Workout[], memberId: string) {
  return exercise.custom && exercise.createdByMemberId === memberId && !workouts.some((workout) => workout.blocks.some((block) => block.exercises.some((item) => item.exerciseId === exercise.id)));
}

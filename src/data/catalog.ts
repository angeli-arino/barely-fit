import catalog from './catalog.generated.json';
import { exercises as prototypeExercises } from './mockData';
import type { Exercise } from '../types';

// This generated file is bundled with the PWA, so catalog browsing and
// attribution remain available with no network connection.
export const catalogExercises = catalog.exercises as Exercise[];
// Old Workout samples still refer to exercises outside this first reviewed
// snapshot. Keep them only for rendering historic prototype Workouts; the
// catalog page exposes generated catalog records and Custom Exercises.
export const exerciseLookup = [
  ...catalogExercises,
  ...prototypeExercises.filter((exercise) => !catalogExercises.some((catalogExercise) => catalogExercise.id === exercise.id)),
];
export const catalogSnapshot = catalog.snapshot;

import type { Exercise, MeasurementType, PerformedSet, Workout } from '../types';

export type ProgressMetric = 'load' | 'repetitions' | 'duration' | 'distance';

export interface ProgressSetEntry {
  workoutId: string;
  workoutName: string;
  date: string;
  itemId: string;
  set: PerformedSet;
}

export interface ProgressRecord {
  value: number;
  workoutId: string;
  setId: string;
  date: string;
}

export interface ExerciseProgress {
  exerciseId: string;
  history: Array<{
    workoutId: string;
    workoutName: string;
    date: string;
    itemId: string;
    workingSets: PerformedSet[];
    warmupSets: PerformedSet[];
  }>;
  workingSets: ProgressSetEntry[];
  warmupSets: ProgressSetEntry[];
  records: Partial<Record<ProgressMetric, ProgressRecord>>;
  estimatedOneRepMax?: ProgressRecord;
  trainingVolume: number;
  trend: {
    measurement: 'load' | 'assistance' | 'distance' | 'duration' | 'repetitions';
    label: string;
    unit: string;
    state: 'empty' | 'insufficient' | 'ready';
    points: Array<{ date: string; value: number }>;
    summary: string;
  };
}

export interface RecentProgress {
  topWeightedSet?: {
    exerciseId: string;
    exerciseName: string;
    load: number;
    repetitions: number;
    monthlyLoadChange: number;
  };
  fourWeekTrainingVolume: number;
  recentDistance?: {
    exerciseId: string;
    exerciseName: string;
    distanceKm: number;
    workoutName: string;
    date: string;
  };
}

const completedWorkingSet = (set: PerformedSet) => set.completed && set.kind === 'working';
const positiveNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

function implementMultiplier(exercise: Exercise): number {
  return exercise.equipment.some((item) => item.toLowerCase() === 'dumbbells') ? 2 : 1;
}

/**
 * Training Volume uses the catalog's Load convention: Load × repetitions ×
 * implement count. Dumbbell Load is per implement, while barbell Load already
 * includes the bar and machine/cable Load is the displayed stack.
 */
export function trainingVolumeForSet(set: PerformedSet, exercise: Exercise): number {
  if (
    exercise.measurementType !== 'reps-load'
    || !completedWorkingSet(set)
    || !positiveNumber(set.load)
    || !positiveNumber(set.reps)
  ) return 0;

  return set.load * set.reps * implementMultiplier(exercise);
}

/**
 * Epley estimate: Load × (1 + repetitions ÷ 30). It is limited to completed
 * weighted Working Sets of 1–10 repetitions, where the estimate is useful.
 */
export function estimatedOneRepMax(set: PerformedSet, exercise: Exercise): number | undefined {
  if (
    exercise.measurementType !== 'reps-load'
    || !completedWorkingSet(set)
    || !positiveNumber(set.load)
    || !positiveNumber(set.reps)
    || set.reps > 10
  ) return undefined;

  return set.load * (1 + set.reps / 30);
}

function completedExerciseHistory(workouts: Workout[], exerciseId: string): ExerciseProgress['history'] {
  return workouts
    .filter((workout) => workout.status === 'completed')
    .flatMap((workout) => workout.blocks.flatMap((block) => block.exercises
      .filter((item) => item.exerciseId === exerciseId)
      .map((item) => ({
        workoutId: workout.id,
        workoutName: workout.name,
        date: workout.date,
        itemId: item.id,
        workingSets: item.sets.filter(completedWorkingSet),
        warmupSets: item.sets.filter((set) => set.completed && set.kind === 'warmup'),
      }))))
    .filter((entry) => entry.workingSets.length > 0 || entry.warmupSets.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date) || b.workoutId.localeCompare(a.workoutId));
}

function flattenSets(
  history: ExerciseProgress['history'],
  kind: 'workingSets' | 'warmupSets',
): ProgressSetEntry[] {
  return history.flatMap((entry) => entry[kind].map((set) => ({
    workoutId: entry.workoutId,
    workoutName: entry.workoutName,
    date: entry.date,
    itemId: entry.itemId,
    set,
  })));
}

function maximumRecord(entries: ProgressSetEntry[], valueOf: (set: PerformedSet) => number | undefined): ProgressRecord | undefined {
  return entries.reduce<ProgressRecord | undefined>((best, entry) => {
    const value = valueOf(entry.set);
    if (!positiveNumber(value) || (best && best.value >= value)) return best;
    return { value, workoutId: entry.workoutId, setId: entry.set.id, date: entry.date };
  }, undefined);
}

const trendConfig: Record<MeasurementType, {
  measurement: ExerciseProgress['trend']['measurement'];
  label: string;
  unit: string;
}> = {
  'reps-load': { measurement: 'load', label: 'Top working-set Load', unit: ' kg' },
  'reps-assistance': { measurement: 'assistance', label: 'Assistance trend', unit: ' kg' },
  'distance-duration': { measurement: 'distance', label: 'Distance trend', unit: ' km' },
  duration: { measurement: 'duration', label: 'Duration trend', unit: ' sec' },
  reps: { measurement: 'repetitions', label: 'Repetition trend', unit: ' reps' },
};

function trendValue(sets: PerformedSet[], measurement: ExerciseProgress['trend']['measurement']): number | undefined {
  const values = sets.flatMap((set) => {
    if (measurement === 'load') return positiveNumber(set.load) ? [set.load] : [];
    if (measurement === 'assistance') return positiveNumber(set.assistance) ? [set.assistance] : [];
    if (measurement === 'distance') return positiveNumber(set.distanceKm) ? [set.distanceKm] : [];
    if (measurement === 'duration') return positiveNumber(set.durationSec) ? [set.durationSec] : [];
    return positiveNumber(set.reps) ? [set.reps] : [];
  });
  if (!values.length) return undefined;
  return measurement === 'assistance' ? Math.min(...values) : Math.max(...values);
}

function buildTrend(history: ExerciseProgress['history'], exercise: Exercise, warmupCount: number): ExerciseProgress['trend'] {
  const { measurement, label, unit } = trendConfig[exercise.measurementType];
  const points = history
    .slice()
    .reverse()
    .flatMap((entry) => {
      const value = trendValue(entry.workingSets, measurement);
      return value === undefined ? [] : [{ date: entry.date, value: Number(value.toFixed(1)) }];
    });
  const state = points.length === 0 ? 'empty' : points.length === 1 ? 'insufficient' : 'ready';
  const first = points.at(0)?.value;
  const last = points.at(-1)?.value;
  const summary = state === 'empty'
    ? `${exercise.name} has no completed Working Sets for this measurement. ${warmupCount} Warm-up Sets are excluded.`
    : state === 'insufficient'
      ? `${exercise.name} has one completed Working Set measurement. Another Workout is needed to form a trend. ${warmupCount} Warm-up Sets are excluded.`
      : `${exercise.name} ${measurement} moved from ${first} to ${last} across ${points.length} logged Workouts. ${warmupCount} Warm-up Sets are excluded.`;

  return { measurement, label, unit, state, points, summary };
}

export function calculateExerciseProgress(workouts: Workout[], exercise: Exercise): ExerciseProgress {
  const history = completedExerciseHistory(workouts, exercise.id);
  const workingSets = flattenSets(history, 'workingSets');
  const warmupSets = flattenSets(history, 'warmupSets');
  const records: ExerciseProgress['records'] = {};

  if (exercise.measurementType === 'reps-load') {
    records.load = maximumRecord(workingSets, (set) => set.load);
    records.repetitions = maximumRecord(workingSets, (set) => set.reps);
  } else if (exercise.measurementType === 'reps-assistance' || exercise.measurementType === 'reps') {
    records.repetitions = maximumRecord(workingSets, (set) => set.reps);
  } else if (exercise.measurementType === 'duration') {
    records.duration = maximumRecord(workingSets, (set) => set.durationSec);
  } else if (exercise.measurementType === 'distance-duration') {
    records.distance = maximumRecord(workingSets, (set) => set.distanceKm);
    records.duration = maximumRecord(workingSets, (set) => set.durationSec);
  }

  const estimated = workingSets.reduce<ProgressRecord | undefined>((best, entry) => {
    const value = estimatedOneRepMax(entry.set, exercise);
    if (value === undefined || (best && best.value >= value)) return best;
    return { value, workoutId: entry.workoutId, setId: entry.set.id, date: entry.date };
  }, undefined);

  return {
    exerciseId: exercise.id,
    history,
    workingSets,
    warmupSets,
    records,
    estimatedOneRepMax: estimated,
    trainingVolume: workingSets.reduce((total, entry) => total + trainingVolumeForSet(entry.set, exercise), 0),
    trend: buildTrend(history, exercise, warmupSets.length),
  };
}

function isoDateDaysBefore(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() - days);
  return parsed.toISOString().slice(0, 10);
}

export function calculateRecentProgress(workouts: Workout[], exercises: Exercise[], referenceDate: string): RecentProgress {
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const weightedEntries = workouts
    .filter((workout) => workout.status === 'completed')
    .flatMap((workout) => workout.blocks.flatMap((block) => block.exercises.flatMap((item) => {
      const exercise = exerciseById.get(item.exerciseId);
      if (!exercise || exercise.measurementType !== 'reps-load') return [];
      return item.sets.filter(completedWorkingSet).flatMap((set) => (
        positiveNumber(set.load) && positiveNumber(set.reps)
          ? [{ workout, exercise, set }]
          : []
      ));
    })));
  const startDate = isoDateDaysBefore(referenceDate, 27);
  const recentWeightedEntries = weightedEntries.filter(({ workout }) => workout.date >= startDate && workout.date <= referenceDate);
  const preferredExerciseId = recentWeightedEntries.some(({ exercise }) => exercise.id === 'back-squat')
    ? 'back-squat'
    : recentWeightedEntries.slice().sort((a, b) => b.set.load! - a.set.load!)[0]?.exercise.id;
  const preferredEntries = recentWeightedEntries.filter(({ exercise }) => exercise.id === preferredExerciseId);
  const top = preferredEntries.slice().sort((a, b) => b.set.load! - a.set.load! || b.set.reps! - a.set.reps!)[0];
  const month = referenceDate.slice(0, 7);
  const monthlyTopLoads = Array.from(preferredEntries
    .filter(({ workout }) => workout.date.startsWith(month))
    .reduce<Map<string, { date: string; load: number }>>((byWorkout, { workout, set }) => {
      const current = byWorkout.get(workout.id);
      if (!current || set.load! > current.load) byWorkout.set(workout.id, { date: workout.date, load: set.load! });
      return byWorkout;
    }, new Map())
    .values())
    .sort((a, b) => a.date.localeCompare(b.date));

  const fourWeekTrainingVolume = workouts
    .filter((workout) => workout.status === 'completed' && workout.date >= startDate && workout.date <= referenceDate)
    .reduce((total, workout) => total + workout.blocks.reduce((blockTotal, block) => blockTotal + block.exercises.reduce((itemTotal, item) => {
      const exercise = exerciseById.get(item.exerciseId);
      if (!exercise) return itemTotal;
      return itemTotal + item.sets.reduce((setTotal, set) => setTotal + trainingVolumeForSet(set, exercise), 0);
    }, 0), 0), 0);

  const recentDistance = workouts
    .filter((workout) => workout.status === 'completed')
    .flatMap((workout) => workout.blocks.flatMap((block) => block.exercises.flatMap((item) => {
      const exercise = exerciseById.get(item.exerciseId);
      if (!exercise || exercise.measurementType !== 'distance-duration') return [];
      return item.sets.filter(completedWorkingSet).flatMap((set) => positiveNumber(set.distanceKm)
        ? [{ exerciseId: exercise.id, exerciseName: exercise.name, distanceKm: set.distanceKm, workoutName: workout.name, date: workout.date }]
        : []);
    })))
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  return {
    topWeightedSet: top ? {
      exerciseId: top.exercise.id,
      exerciseName: top.exercise.name,
      load: top.set.load!,
      repetitions: top.set.reps!,
      monthlyLoadChange: monthlyTopLoads.length > 1
        ? monthlyTopLoads.at(-1)!.load - monthlyTopLoads[0].load
        : 0,
    } : undefined,
    fourWeekTrainingVolume,
    recentDistance,
  };
}

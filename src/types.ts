export type SyncState = 'online' | 'offline' | 'syncing' | 'synced' | 'error';
export type TodayScenario = 'active' | 'planned' | 'rest' | 'empty';
export type MeasurementType = 'reps-load' | 'reps-assistance' | 'duration' | 'distance-duration' | 'reps';
export type SetKind = 'warmup' | 'working';
export type ExerciseBlockType = 'single' | 'paired' | 'rounds';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  measurementType: MeasurementType;
  instructions: string[];
  custom?: boolean;
  catalog?: boolean;
  createdByMemberId?: string;
  placeholderLabel?: string;
  illustration?: {
    url: string;
    source: string;
    author: string;
    license: string;
    licenseUrl: string;
    sourceUrl: string;
  };
  provenance: {
    source: string;
    sourceId: string;
    sourceUrl?: string;
    author: string;
    license: string;
    licenseUrl?: string;
    snapshotDate: string;
    revision?: string;
    modified: boolean;
    reviewStatus: 'placeholder' | 'verified' | 'private';
  };
}

export interface SetTarget {
  id: string;
  kind: SetKind;
  targetLoad?: number;
  targetReps?: number;
  targetAssistance?: number | string;
  targetDurationSec?: number;
  targetDistanceKm?: number;
  rir?: number;
}

export interface PerformedSet extends SetTarget {
  completed: boolean;
  completedAt?: string;
  load?: number;
  reps?: number;
  assistance?: number | string;
  durationSec?: number;
  distanceKm?: number;
  notes?: string;
}

export type SetMeasurements = Pick<PerformedSet, 'load' | 'reps' | 'assistance' | 'durationSec' | 'distanceKm' | 'rir' | 'notes'>;

export interface ExerciseItem {
  id: string;
  exerciseId: string;
  restSec: number;
  sets: PerformedSet[];
  priorSummary: string;
  notes?: string;
}

export interface ExerciseBlock {
  id: string;
  type: ExerciseBlockType;
  title?: string;
  exercises: ExerciseItem[];
  rounds?: number;
}

export interface WorkoutTemplate {
  id: string;
  memberId: string;
  name: string;
  estimatedMin: number;
  focus: string;
  blocks: ExerciseBlock[];
  updatedAt: string;
}

export interface Workout {
  id: string;
  memberId: string;
  templateId?: string;
  name: string;
  date: string;
  startedAt?: string;
  completedAt?: string;
  durationMin?: number;
  status: 'planned' | 'active' | 'completed' | 'skipped';
  blocks: ExerciseBlock[];
  notes?: string;
  recurrence?: 'weekly';
  recurrenceSeriesId?: string;
  recurrenceEndDate?: string;
}

export interface RaceGoal {
  id: string;
  eventName: string;
  date: string;
  distanceKm: number;
  targetTime?: string;
}

export interface TrainingProfile {
  primaryGoals: string;
  availableEquipment: string;
  preferredWorkoutLengthMin: number;
  weeklyFrequency: number;
  preferredExercises: string;
  avoidedExercises: string;
  physicalLimitations: string;
}

export interface RestTimerState {
  active: boolean;
  remainingSec: number;
  initialSec: number;
  paused: boolean;
  exerciseName?: string;
  nextSetLabel?: string;
  sound: boolean;
  vibration: boolean;
}

import type { Exercise, ExerciseBlock, PerformedSet, Workout, WorkoutTemplate } from '../types';

export const prototypeMemberId = 'prototype-member';

const performedSet = (
  id: string,
  kind: 'warmup' | 'working',
  target: { load?: number; reps?: number; assistance?: number | string; durationSec?: number; distanceKm?: number; rir?: number },
) => ({
  id,
  kind,
  targetLoad: target.load,
  targetReps: target.reps,
  targetAssistance: target.assistance,
  targetDurationSec: target.durationSec,
  targetDistanceKm: target.distanceKm,
  rir: target.rir,
  completed: false,
});

const exerciseSeeds: Omit<Exercise, 'provenance'>[] = [
  {
    id: 'back-squat',
    name: 'Barbell Back Squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: ['Barbell', 'Rack'],
    measurementType: 'reps-load',
    placeholderLabel: 'Neutral squat illustration placeholder',
    instructions: ['Brace before unracking.', 'Descend under control to a consistent depth.', 'Drive evenly through the whole foot.'],
  },
  {
    id: 'rdl',
    name: 'Romanian Deadlift',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Back'],
    equipment: ['Barbell'],
    measurementType: 'reps-load',
    placeholderLabel: 'Neutral hip-hinge illustration placeholder',
    instructions: ['Keep the bar close.', 'Push hips back with soft knees.', 'Stop when hamstring tension peaks without losing position.'],
  },
  {
    id: 'leg-press',
    name: '45° Leg Press',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    equipment: ['Machine'],
    measurementType: 'reps-load',
    placeholderLabel: 'Neutral machine illustration placeholder',
    instructions: ['Set feet before unlocking.', 'Lower without pelvis curling.', 'Do not lock knees hard.'],
  },
  {
    id: 'leg-curl',
    name: 'Seated Leg Curl',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Calves'],
    equipment: ['Machine'],
    measurementType: 'reps-load',
    placeholderLabel: 'Neutral machine illustration placeholder',
    instructions: ['Align knee with pivot.', 'Keep hips down.', 'Pause briefly in the shortened position.'],
  },
  {
    id: 'machine-pullup',
    name: 'Machine-Assisted Pull-up',
    primaryMuscles: ['Lats'],
    secondaryMuscles: ['Biceps', 'Upper back'],
    equipment: ['Assisted pull-up machine'],
    measurementType: 'reps-assistance',
    placeholderLabel: 'Neutral assisted pull-up illustration placeholder',
    instructions: ['Use assistance that preserves smooth reps.', 'Lead with elbows.', 'Avoid shrugging at the top.'],
  },
  {
    id: 'band-pullup',
    name: 'Band-Assisted Pull-up',
    primaryMuscles: ['Lats'],
    secondaryMuscles: ['Biceps', 'Upper back'],
    equipment: ['Pull-up bar', 'Resistance band'],
    measurementType: 'reps-assistance',
    placeholderLabel: 'Neutral band pull-up illustration placeholder',
    instructions: ['Secure the band fully.', 'Control the bottom position.', 'Use the same band setup for comparable history.'],
  },
  {
    id: 'db-bench',
    name: 'Dumbbell Bench Press',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Front delts'],
    equipment: ['Dumbbells', 'Bench'],
    measurementType: 'reps-load',
    placeholderLabel: 'Neutral bench press illustration placeholder',
    instructions: ['Load is per dumbbell.', 'Keep shoulder blades set.', 'Use a controlled touch point.'],
  },
  {
    id: 'cable-row',
    name: 'Seated Cable Row',
    primaryMuscles: ['Upper back', 'Lats'],
    secondaryMuscles: ['Biceps'],
    equipment: ['Cable machine'],
    measurementType: 'reps-load',
    placeholderLabel: 'Neutral cable-row illustration placeholder',
    instructions: ['Stay tall.', 'Pull elbows toward pockets.', 'Return without rounding forward.'],
  },
  {
    id: 'lateral-raise',
    name: 'Dumbbell Lateral Raise',
    primaryMuscles: ['Side delts'],
    secondaryMuscles: ['Upper traps'],
    equipment: ['Dumbbells'],
    measurementType: 'reps-load',
    placeholderLabel: 'Neutral lateral-raise illustration placeholder',
    instructions: ['Load is per dumbbell.', 'Lead with elbows.', 'Stop before shrugging takes over.'],
  },
  {
    id: 'triceps-pressdown',
    name: 'Cable Triceps Pressdown',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    equipment: ['Cable machine'],
    measurementType: 'reps-load',
    placeholderLabel: 'Neutral cable exercise illustration placeholder',
    instructions: ['Keep elbows pinned.', 'Reach full extension without leaning.', 'Control the return.'],
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    primaryMuscles: ['Core'],
    secondaryMuscles: ['Hip flexors'],
    equipment: ['Mat'],
    measurementType: 'reps',
    placeholderLabel: 'Neutral floor exercise illustration placeholder',
    instructions: ['Keep lower back gently supported.', 'Move opposite arm and leg slowly.', 'Stop before the ribs flare.'],
  },
  {
    id: 'farmer-carry',
    name: 'Farmer Carry',
    primaryMuscles: ['Grip', 'Core'],
    secondaryMuscles: ['Upper back'],
    equipment: ['Dumbbells'],
    measurementType: 'distance-duration',
    placeholderLabel: 'Neutral loaded-carry illustration placeholder',
    instructions: ['Load is per hand.', 'Walk tall with short controlled steps.', 'Turn safely before fatigue distorts posture.'],
  },
  {
    id: 'plank',
    name: 'Front Plank',
    primaryMuscles: ['Core'],
    secondaryMuscles: ['Glutes', 'Shoulders'],
    equipment: ['Mat'],
    measurementType: 'duration',
    placeholderLabel: 'Neutral plank illustration placeholder',
    instructions: ['Stack shoulders over elbows.', 'Squeeze glutes.', 'Finish when position changes.'],
  },
  {
    id: 'easy-run',
    name: 'Easy Run',
    primaryMuscles: ['Cardio'],
    secondaryMuscles: ['Calves', 'Quads'],
    equipment: ['Running shoes'],
    measurementType: 'distance-duration',
    placeholderLabel: 'Neutral running illustration placeholder',
    instructions: ['Keep effort conversational.', 'Use distance and elapsed time.', 'Stop for pain that changes stride.'],
  },
];

export const exercises: Exercise[] = exerciseSeeds.map((exercise) => ({
  ...exercise,
  provenance: {
    source: 'Prototype seed; wger review pending',
    sourceId: exercise.id,
    author: 'Barely Fit prototype',
    license: 'Not licensed for catalog release',
    snapshotDate: '2026-07-23',
    modified: true,
    reviewStatus: 'placeholder',
  },
}));

const lowerBlocks: ExerciseBlock[] = [
  {
    id: 'lower-squat',
    type: 'single',
    exercises: [{
      id: 'lower-squat-item',
      exerciseId: 'back-squat',
      restSec: 150,
      priorSummary: 'Last: 60 kg × 5, 5, 5 · RIR 2',
      sets: [
        performedSet('sq-w1', 'warmup', { load: 20, reps: 8 }),
        performedSet('sq-w2', 'warmup', { load: 40, reps: 5 }),
        performedSet('sq-1', 'working', { load: 62.5, reps: 5, rir: 2 }),
        performedSet('sq-2', 'working', { load: 62.5, reps: 5, rir: 2 }),
        performedSet('sq-3', 'working', { load: 62.5, reps: 5, rir: 2 }),
      ],
    }],
  },
  {
    id: 'lower-rdl',
    type: 'single',
    exercises: [{
      id: 'lower-rdl-item',
      exerciseId: 'rdl',
      restSec: 120,
      priorSummary: 'Last: 55 kg × 8, 8, 8',
      sets: [performedSet('rdl-1', 'working', { load: 57.5, reps: 8, rir: 2 }), performedSet('rdl-2', 'working', { load: 57.5, reps: 8, rir: 2 }), performedSet('rdl-3', 'working', { load: 57.5, reps: 8, rir: 2 })],
    }],
  },
  {
    id: 'lower-paired',
    type: 'paired',
    title: 'Machine finisher',
    exercises: [
      {
        id: 'lower-legpress-item',
        exerciseId: 'leg-press',
        restSec: 90,
        priorSummary: 'Last: 110 kg × 10, 10, 9',
        sets: [performedSet('lp-1', 'working', { load: 112.5, reps: 10 }), performedSet('lp-2', 'working', { load: 112.5, reps: 10 }), performedSet('lp-3', 'working', { load: 112.5, reps: 10 })],
      },
      {
        id: 'lower-curl-item',
        exerciseId: 'leg-curl',
        restSec: 90,
        priorSummary: 'Last: 32.5 kg × 12, 11, 10',
        sets: [performedSet('lc-1', 'working', { load: 32.5, reps: 12 }), performedSet('lc-2', 'working', { load: 32.5, reps: 12 }), performedSet('lc-3', 'working', { load: 32.5, reps: 12 })],
      },
    ],
  },
];

const upperBlocks: ExerciseBlock[] = [
  {
    id: 'upper-pullup',
    type: 'single',
    exercises: [{
      id: 'upper-pullup-item',
      exerciseId: 'machine-pullup',
      restSec: 120,
      priorSummary: 'Last: 28 kg assistance × 6, 6, 5',
      sets: [performedSet('pu-w1', 'warmup', { assistance: 40, reps: 6 }), performedSet('pu-1', 'working', { assistance: 26, reps: 6, rir: 2 }), performedSet('pu-2', 'working', { assistance: 26, reps: 6, rir: 2 }), performedSet('pu-3', 'working', { assistance: 26, reps: 6, rir: 2 })],
    }],
  },
  {
    id: 'upper-bench',
    type: 'single',
    exercises: [{
      id: 'upper-bench-item',
      exerciseId: 'db-bench',
      restSec: 105,
      priorSummary: 'Last: 15 kg/hand × 8, 8, 7',
      sets: [performedSet('dbb-w1', 'warmup', { load: 8, reps: 10 }), performedSet('dbb-1', 'working', { load: 15, reps: 8, rir: 2 }), performedSet('dbb-2', 'working', { load: 15, reps: 8, rir: 2 }), performedSet('dbb-3', 'working', { load: 15, reps: 8, rir: 2 })],
    }],
  },
  {
    id: 'upper-row',
    type: 'single',
    exercises: [{
      id: 'upper-row-item',
      exerciseId: 'cable-row',
      restSec: 90,
      priorSummary: 'Last: 37.5 kg × 10, 10, 10',
      sets: [performedSet('row-1', 'working', { load: 40, reps: 10, rir: 2 }), performedSet('row-2', 'working', { load: 40, reps: 10, rir: 2 }), performedSet('row-3', 'working', { load: 40, reps: 10, rir: 2 })],
    }],
  },
  {
    id: 'upper-paired',
    type: 'paired',
    title: 'Shoulders + arms',
    exercises: [
      {
        id: 'upper-lateral-item',
        exerciseId: 'lateral-raise',
        restSec: 75,
        priorSummary: 'Last: 5 kg/hand × 12, 11, 10',
        sets: [performedSet('lat-1', 'working', { load: 5, reps: 12 }), performedSet('lat-2', 'working', { load: 5, reps: 12 }), performedSet('lat-3', 'working', { load: 5, reps: 12 })],
      },
      {
        id: 'upper-tri-item',
        exerciseId: 'triceps-pressdown',
        restSec: 75,
        priorSummary: 'Last: 17.5 kg × 12, 12, 11',
        sets: [performedSet('tri-1', 'working', { load: 20, reps: 12 }), performedSet('tri-2', 'working', { load: 20, reps: 12 }), performedSet('tri-3', 'working', { load: 20, reps: 12 })],
      },
    ],
  },
];

const roundsBlocks: ExerciseBlock[] = [{
  id: 'core-rounds',
  type: 'rounds',
  title: 'Three rounds · smooth, not frantic',
  rounds: 3,
  exercises: [
    { id: 'deadbug-item', exerciseId: 'dead-bug', restSec: 30, priorSummary: 'Last: 10/side × 3', sets: [performedSet('db-1', 'working', { reps: 10 }), performedSet('db-2', 'working', { reps: 10 }), performedSet('db-3', 'working', { reps: 10 })] },
    { id: 'carry-item', exerciseId: 'farmer-carry', restSec: 45, priorSummary: 'Last: 16 kg/hand · 40 m', sets: [performedSet('fc-1', 'working', { load: 18, distanceKm: 0.04, durationSec: 35 }), performedSet('fc-2', 'working', { load: 18, distanceKm: 0.04, durationSec: 35 }), performedSet('fc-3', 'working', { load: 18, distanceKm: 0.04, durationSec: 35 })] },
    { id: 'plank-item', exerciseId: 'plank', restSec: 60, priorSummary: 'Last: 45 sec × 3', sets: [performedSet('pl-1', 'working', { durationSec: 50 }), performedSet('pl-2', 'working', { durationSec: 50 }), performedSet('pl-3', 'working', { durationSec: 50 })] },
  ],
}];

const templateSeeds: Omit<WorkoutTemplate, 'memberId'>[] = [
  { id: 'heavy-legs', name: 'Heavy Legs', estimatedMin: 70, focus: 'Strength · lower body', blocks: lowerBlocks, updatedAt: '2026-07-19' },
  { id: 'upper-b', name: 'Upper Strength B', estimatedMin: 58, focus: 'Pull + press · upper body', blocks: upperBlocks, updatedAt: '2026-07-20' },
  { id: 'core-carry', name: 'Core + Carry Rounds', estimatedMin: 28, focus: 'Rounds block · trunk and grip', blocks: roundsBlocks, updatedAt: '2026-07-12' },
];

export const templates: WorkoutTemplate[] = templateSeeds.map((template) => ({ ...template, memberId: prototypeMemberId }));

const completedSet = (base: PerformedSet, values: Partial<PerformedSet>): PerformedSet => ({ ...base, ...values, completed: true, completedAt: '2026-07-17T18:30:00+12:00' });

const completedBlocks = (source: ExerciseBlock[], modifier = 0): ExerciseBlock[] => source.map((block) => ({
  ...block,
  exercises: block.exercises.map((item) => ({
    ...item,
    sets: item.sets.map((s, index) => completedSet(s, {
      load: s.targetLoad ? s.targetLoad + modifier : undefined,
      reps: s.targetReps ? Math.max(1, s.targetReps - (index === item.sets.length - 1 && s.kind === 'working' ? 1 : 0)) : undefined,
      assistance: s.targetAssistance,
      durationSec: s.targetDurationSec,
      distanceKm: s.targetDistanceKm,
    })),
  })),
}));

const workoutSeeds: Omit<Workout, 'memberId'>[] = [
  {
    id: 'active-upper-0723',
    templateId: 'upper-b',
    name: 'Upper Strength B',
    date: '2026-07-23',
    startedAt: '2026-07-23T18:42:00+12:00',
    status: 'active',
    blocks: upperBlocks,
    notes: 'Recovered locally after the app was closed.',
  },
  {
    id: 'plan-heavy-0724',
    templateId: 'heavy-legs',
    name: 'Heavy Legs',
    date: '2026-07-24',
    status: 'planned',
    recurrence: 'weekly',
    recurrenceSeriesId: 'weekly-heavy-legs',
    recurrenceEndDate: '2027-07-16',
    blocks: lowerBlocks,
  },
  {
    id: 'plan-longrun-0726',
    name: 'Long Run · 12 km easy',
    date: '2026-07-26',
    status: 'planned',
    recurrence: 'weekly',
    recurrenceSeriesId: 'weekly-long-run',
    recurrenceEndDate: '2027-07-18',
    blocks: [{
      id: 'run-block', type: 'single', exercises: [{ id: 'run-item', exerciseId: 'easy-run', restSec: 0, priorSummary: 'Last: 10 km · 1:35:12', sets: [performedSet('run-set', 'working', { distanceKm: 12, durationSec: 6840 })] }],
    }],
  },
  {
    id: 'plan-upper-0721-unresolved',
    templateId: 'upper-b',
    name: 'Upper Strength B',
    date: '2026-07-21',
    status: 'planned',
    blocks: upperBlocks,
    notes: 'Unresolved Planned Workout: complete late, reschedule, or skip.',
  },
  {
    id: 'history-lower-0717',
    templateId: 'heavy-legs',
    name: 'Heavy Legs',
    date: '2026-07-17',
    startedAt: '2026-07-17T17:26:00+12:00',
    completedAt: '2026-07-17T18:38:00+12:00',
    durationMin: 72,
    status: 'completed',
    blocks: completedBlocks(lowerBlocks, -2.5),
    notes: 'Good depth. Kept two reps in reserve.',
  },
  {
    id: 'history-upper-0718',
    templateId: 'upper-b',
    name: 'Upper Strength B',
    date: '2026-07-18',
    startedAt: '2026-07-18T10:04:00+12:00',
    completedAt: '2026-07-18T11:02:00+12:00',
    durationMin: 58,
    status: 'completed',
    blocks: completedBlocks(upperBlocks),
  },
  {
    id: 'history-runupper-0721',
    name: 'Easy Run + Upper A',
    date: '2026-07-21',
    startedAt: '2026-07-21T17:40:00+12:00',
    completedAt: '2026-07-21T19:05:00+12:00',
    durationMin: 85,
    status: 'completed',
    blocks: [
      { id: 'run-5k', type: 'single', exercises: [{ id: 'run-5k-item', exerciseId: 'easy-run', restSec: 0, priorSummary: 'Previous: 5 km · 46:50', sets: [{ ...performedSet('run5', 'working', { distanceKm: 5, durationSec: 2732 }), completed: true, distanceKm: 5, durationSec: 2732, completedAt: '2026-07-21T18:26:00+12:00' }] }] },
      { id: 'row-mini', type: 'single', exercises: [{ id: 'row-mini-item', exerciseId: 'cable-row', restSec: 90, priorSummary: 'Previous: 37.5 kg × 10', sets: [completedSet(performedSet('rowm1', 'working', { load: 37.5, reps: 10 }), { load: 37.5, reps: 10 }), completedSet(performedSet('rowm2', 'working', { load: 37.5, reps: 10 }), { load: 37.5, reps: 10 }), completedSet(performedSet('rowm3', 'working', { load: 37.5, reps: 10 }), { load: 37.5, reps: 9 })] }] },
    ],
  },
  {
    id: 'history-lower-0713',
    templateId: 'heavy-legs',
    name: 'Heavy Legs',
    date: '2026-07-13',
    startedAt: '2026-07-13T17:30:00+12:00',
    completedAt: '2026-07-13T18:37:00+12:00',
    durationMin: 67,
    status: 'completed',
    blocks: completedBlocks(lowerBlocks, -5),
  },
];

export const initialWorkouts: Workout[] = workoutSeeds.map((workout) => ({ ...workout, memberId: prototypeMemberId }));

export const progressData = {
  squat: [
    { date: '2026-06-15', load: 52.5, reps: 6, volume: 945 },
    { date: '2026-06-29', load: 55, reps: 6, volume: 990 },
    { date: '2026-07-13', load: 57.5, reps: 5, volume: 862.5 },
    { date: '2026-07-17', load: 60, reps: 5, volume: 900 },
  ],
  run: [
    { date: '2026-06-28', distance: 7, minutes: 68.4 },
    { date: '2026-07-05', distance: 8, minutes: 77.1 },
    { date: '2026-07-12', distance: 10, minutes: 95.2 },
    { date: '2026-07-21', distance: 5, minutes: 45.53 },
  ],
};

export const weekDates = [
  { iso: '2026-07-20', day: 'Mon', date: '20' },
  { iso: '2026-07-21', day: 'Tue', date: '21' },
  { iso: '2026-07-22', day: 'Wed', date: '22' },
  { iso: '2026-07-23', day: 'Thu', date: '23' },
  { iso: '2026-07-24', day: 'Fri', date: '24' },
  { iso: '2026-07-25', day: 'Sat', date: '25' },
  { iso: '2026-07-26', day: 'Sun', date: '26' },
];

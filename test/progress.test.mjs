import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateExerciseProgress,
  calculateRecentProgress,
  estimatedOneRepMax,
  trainingVolumeForSet,
} from '../.test-build/src/domain/progress.js';
import { trendLabelIndexes } from '../.test-build/src/components/charts/chartLabels.js';

const exercise = (id, measurementType, equipment = []) => ({
  id,
  name: id,
  measurementType,
  equipment,
  primaryMuscles: [],
  secondaryMuscles: [],
  instructions: [],
  provenance: {
    source: 'test',
    sourceId: id,
    author: 'test',
    license: 'test',
    snapshotDate: '2026-07-23',
    modified: false,
    reviewStatus: 'verified',
  },
});

const performedSet = (id, overrides = {}) => ({
  id,
  kind: 'working',
  completed: true,
  ...overrides,
});

const workout = (id, date, exerciseId, sets, overrides = {}) => ({
  id,
  memberId: 'member-1',
  date,
  name: id,
  status: 'completed',
  blocks: [{
    id: `${id}-block`,
    type: 'single',
    exercises: [{
      id: `${id}-item`,
      exerciseId,
      restSec: 90,
      priorSummary: '',
      sets,
    }],
  }],
  ...overrides,
});

const squat = exercise('squat', 'reps-load', ['Barbell', 'Rack']);
const press = exercise('press', 'reps-load', ['Dumbbells', 'Bench']);
const run = exercise('run', 'distance-duration');

test('separates Warm-ups and excludes them from records, e1RM, volume, and trends', () => {
  const history = [
    workout('older', '2026-07-01', 'squat', [
      performedSet('warmup', { kind: 'warmup', load: 200, reps: 20 }),
      performedSet('working-1', { load: 80, reps: 5 }),
    ]),
    workout('newer', '2026-07-20', 'squat', [
      performedSet('working-2', { load: 100, reps: 5 }),
    ]),
  ];

  const result = calculateExerciseProgress(history, squat);

  assert.equal(result.workingSets.length, 2);
  assert.equal(result.warmupSets.length, 1);
  assert.equal(result.records.load?.value, 100);
  assert.equal(result.records.repetitions?.value, 5);
  assert.equal(Math.round(result.estimatedOneRepMax?.value ?? 0), 117);
  assert.equal(result.trainingVolume, 900);
  assert.deepEqual(result.trend.points.map(({ value }) => value), [80, 100]);
});

test('reports each record that applies to the Exercise measurement type', () => {
  const result = calculateExerciseProgress([
    workout('run-1', '2026-07-01', 'run', [
      performedSet('first', { distanceKm: 5, durationSec: 1800 }),
      performedSet('second', { distanceKm: 3, durationSec: 2100, reps: 2 }),
    ]),
  ], run);

  assert.equal(result.records.distance?.value, 5);
  assert.equal(result.records.duration?.value, 2100);
  assert.equal(result.records.load, undefined);
  assert.equal(result.records.repetitions, undefined);
});

test('uses Epley only for eligible weighted Working Sets with 1–10 repetitions', () => {
  assert.equal(estimatedOneRepMax(performedSet('eligible', { load: 100, reps: 5 }), squat), 100 * (1 + 5 / 30));
  assert.equal(estimatedOneRepMax(performedSet('high-rep', { load: 80, reps: 15 }), squat), undefined);
  assert.equal(estimatedOneRepMax(performedSet('warmup', { kind: 'warmup', load: 100, reps: 5 }), squat), undefined);
  assert.equal(estimatedOneRepMax(performedSet('bodyweight', { reps: 5 }), squat), undefined);
});

test('calculates Training Volume using catalog implement conventions', () => {
  assert.equal(trainingVolumeForSet(performedSet('barbell', { load: 100, reps: 5 }), squat), 500);
  assert.equal(trainingVolumeForSet(performedSet('dumbbells', { load: 20, reps: 10 }), press), 400);
  assert.equal(trainingVolumeForSet(performedSet('warmup', { kind: 'warmup', load: 20, reps: 10 }), press), 0);
  assert.equal(trainingVolumeForSet(performedSet('cardio', { distanceKm: 5, durationSec: 1800 }), run), 0);
});

test('derives corrected and deleted history deterministically without retained state', () => {
  const original = workout('squat-1', '2026-07-01', 'squat', [performedSet('set-1', { load: 80, reps: 5 })]);
  const corrected = structuredClone(original);
  corrected.blocks[0].exercises[0].sets[0].load = 90;

  assert.equal(calculateExerciseProgress([original], squat).records.load?.value, 80);
  assert.equal(calculateExerciseProgress([corrected], squat).records.load?.value, 90);
  assert.equal(calculateExerciseProgress([], squat).records.load, undefined);
});

test('marks empty and one-point trends distinctly', () => {
  assert.equal(calculateExerciseProgress([], squat).trend.state, 'empty');
  assert.equal(calculateExerciseProgress([
    workout('only', '2026-07-01', 'squat', [performedSet('set', { load: 80, reps: 5 })]),
  ], squat).trend.state, 'insufficient');
});

test('builds Today summaries from the same volume and history calculations', () => {
  const history = [
    workout('squat-1', '2026-07-01', 'squat', [performedSet('s1', { load: 80, reps: 5 })]),
    workout('squat-2', '2026-07-20', 'squat', [performedSet('s2', { load: 100, reps: 5 })]),
    workout('press-1', '2026-07-22', 'press', [performedSet('p1', { load: 20, reps: 10 })]),
    workout('run-1', '2026-07-21', 'run', [performedSet('r1', { distanceKm: 5, durationSec: 1800 })]),
  ];

  const result = calculateRecentProgress(history, [squat, press, run], '2026-07-23');

  assert.equal(result.topWeightedSet?.exerciseId, 'squat');
  assert.equal(result.topWeightedSet?.load, 100);
  assert.equal(result.topWeightedSet?.monthlyLoadChange, 20);
  assert.equal(result.fourWeekTrainingVolume, 1300);
  assert.equal(result.recentDistance?.distanceKm, 5);
});

test('Today reports directional monthly Load change and ignores old top Sets', () => {
  const history = [
    workout('old-max', '2026-05-01', 'squat', [performedSet('old', { load: 140, reps: 5 })]),
    workout('month-start', '2026-07-01', 'squat', [performedSet('start', { load: 100, reps: 5 })]),
    workout('month-end', '2026-07-20', 'squat', [performedSet('end', { load: 80, reps: 5 })]),
  ];

  const result = calculateRecentProgress(history, [squat], '2026-07-23');

  assert.equal(result.topWeightedSet?.load, 100);
  assert.equal(result.topWeightedSet?.monthlyLoadChange, -20);
});

test('long trends keep endpoint labels and thin intermediate labels for phones', () => {
  assert.deepEqual(trendLabelIndexes(4), new Set([0, 1, 2, 3]));
  const labels = trendLabelIndexes(24);
  assert.equal(labels.has(0), true);
  assert.equal(labels.has(23), true);
  assert.ok(labels.size <= 6);
});

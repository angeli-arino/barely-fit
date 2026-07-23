import assert from 'node:assert/strict';
import test from 'node:test';
import {
  correctCompletedWorkout,
  deleteCompletedWorkout,
  restoreDeletedWorkout,
  chronologicalCompletedWorkouts,
  recoveredHistorySyncState,
  chooseRecoveredHistory,
} from '../.test-build/src/domain/workoutHistory.js';

const set = (id, overrides = {}) => ({ id, kind: 'working', completed: true, reps: 8, ...overrides });
const workout = (id, memberId, date, overrides = {}) => ({
  id, memberId, date, name: id, status: 'completed', durationMin: 40,
  blocks: [{ id: `${id}-block`, type: 'single', exercises: [{ id: `${id}-item`, exerciseId: 'squat', restSec: 90, priorSummary: '', sets: [set(`${id}-set`)] }] }],
  ...overrides,
});

test('corrects one canonical completed Workout without duplicating its record', () => {
  const original = workout('w1', 'member-1', '2026-07-20');
  const corrected = { ...structuredClone(original), date: '2026-07-21', notes: 'Corrected', blocks: [{ ...original.blocks[0], exercises: [{ ...original.blocks[0].exercises[0], exerciseId: 'deadlift', sets: [set('w1-set', { reps: 6, notes: 'Straps' })] }] }] };

  const once = correctCompletedWorkout([original], corrected, 'member-1').workouts;
  const twice = correctCompletedWorkout(once, corrected, 'member-1').workouts;

  assert.equal(twice.length, 1);
  assert.equal(twice[0].id, 'w1');
  assert.equal(twice[0].date, '2026-07-21');
  assert.equal(twice[0].blocks[0].exercises[0].exerciseId, 'deadlift');
  assert.equal(twice[0].blocks[0].exercises[0].sets[0].notes, 'Straps');
});

test('refuses to correct or delete another Member’s Workout History', () => {
  const privateWorkout = workout('private', 'member-2', '2026-07-20');
  const attempted = { ...privateWorkout, notes: 'Changed' };

  assert.deepEqual(correctCompletedWorkout([privateWorkout], attempted, 'member-1').workouts, [privateWorkout]);
  assert.equal(deleteCompletedWorkout([privateWorkout], 'private', 'member-1').deletedWorkout, undefined);
});

test('same-id records cannot delete another Member history and invalid numbers are rejected', () => {
  const own = workout('shared-id', 'member-1', '2026-07-20');
  const another = workout('shared-id', 'member-2', '2026-07-21');
  const deleted = deleteCompletedWorkout([own, another], 'shared-id', 'member-1');
  const invalid = { ...own, blocks: [{ ...own.blocks[0], exercises: [{ ...own.blocks[0].exercises[0], sets: [set('bad', { load: Number.NaN })] }] }] };

  assert.deepEqual(deleted.workouts, [another]);
  assert.equal(correctCompletedWorkout([own], invalid, 'member-1').corrected, false);
  assert.match(correctCompletedWorkout([own], { ...own, date: '2026-02-31' }, 'member-1').error, /valid Workout date/);
  assert.match(correctCompletedWorkout([own], { ...own, blocks: [] }, 'member-1').error, /performed Exercise/);
  assert.match(correctCompletedWorkout([own], { ...own, blocks: [{ ...own.blocks[0], type: 'single', exercises: [...own.blocks[0].exercises, structuredClone(own.blocks[0].exercises[0])] }] }, 'member-1').error, /exactly one Exercise/);
});

test('delete and undo are idempotent and never duplicate a Workout', () => {
  const original = workout('w1', 'member-1', '2026-07-20');
  const deleted = deleteCompletedWorkout([original], 'w1', 'member-1');
  const restored = restoreDeletedWorkout(deleted.workouts, deleted.deletedWorkout);
  const restoredAgain = restoreDeletedWorkout(restored, deleted.deletedWorkout);

  assert.deepEqual(deleted.workouts, []);
  assert.equal(restoredAgain.length, 1);
  assert.equal(restoredAgain[0].id, 'w1');
});

test('lists completed Workouts newest first without mutating canonical history', () => {
  const older = workout('older', 'member-1', '2026-07-01');
  const active = workout('active', 'member-1', '2026-07-30', { status: 'active' });
  const newer = workout('newer', 'member-1', '2026-07-20');
  const history = [older, active, newer];

  assert.deepEqual(chronologicalCompletedWorkouts(history).map(({ id }) => id), ['newer', 'older']);
  assert.deepEqual(history.map(({ id }) => id), ['older', 'active', 'newer']);
});

test('cached offline corrections resume idempotent synchronization after an online restart', () => {
  const corrected = correctCompletedWorkout([workout('w1', 'member-1', '2026-07-20')], workout('w1', 'member-1', '2026-07-21'), 'member-1').workouts;
  const cached = JSON.parse(JSON.stringify({ workouts: corrected }));

  assert.equal(recoveredHistorySyncState(true, false, true, true), 'syncing');
  assert.equal(recoveredHistorySyncState(true, true, false, false), 'offline');
  assert.equal(cached.workouts.length, 1);
  assert.equal(cached.workouts[0].id, 'w1');
  assert.equal(chooseRecoveredHistory({ updatedAt: '2026-07-20T00:00:00Z', pending: false }, '2026-07-21T00:00:00Z'), 'remote');
  assert.equal(chooseRecoveredHistory({ updatedAt: '2026-07-20T00:00:00Z', pending: true }, '2026-07-21T00:00:00Z'), 'local');
});

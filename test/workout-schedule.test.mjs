import assert from 'node:assert/strict';
import test from 'node:test';
import {
  planWorkoutTemplate,
  reschedulePlannedWorkout,
  startPlannedWorkout,
  resolvePlannedWorkout,
  workoutSchedule,
} from '../.test-build/src/domain/workoutSchedule.js';

const template = {
  id: 'upper',
  memberId: 'member-1',
  name: 'Upper Strength',
  estimatedMin: 45,
  focus: 'Upper body',
  updatedAt: '2026-07-01',
  blocks: [],
};

test('plans selected weekdays through an inclusive end date idempotently', () => {
  const input = {
    workouts: [],
    template,
    memberId: 'member-1',
    startDate: '2026-07-24',
    weekdays: [1, 5],
    endDate: '2026-08-03',
    mutationId: 'plan-123',
    today: '2026-07-23',
  };

  const once = planWorkoutTemplate(input);
  const twice = planWorkoutTemplate({ ...input, workouts: once });

  assert.deepEqual(once.map(({ date }) => date), ['2026-07-24', '2026-07-27', '2026-07-31', '2026-08-03']);
  assert.equal(twice.length, 4);
  assert.equal(new Set(twice.map(({ id }) => id)).size, 4);
  assert.ok(twice.every(({ recurrenceEndDate }) => recurrenceEndDate === '2026-08-03'));
});

test('only assigns a Workout Template to a future date', () => {
  const shared = {
    workouts: [],
    template,
    memberId: 'member-1',
    mutationId: 'future-only',
    today: '2026-07-24',
  };

  assert.deepEqual(planWorkoutTemplate({ ...shared, startDate: '2026-07-23' }), []);
  assert.deepEqual(planWorkoutTemplate({ ...shared, startDate: '2026-07-24' }), []);
  assert.equal(planWorkoutTemplate({ ...shared, startDate: '2026-07-25' }).length, 1);
});

test('moves one recurring occurrence without changing later occurrences', () => {
  const workouts = planWorkoutTemplate({
    workouts: [],
    template,
    memberId: 'member-1',
    startDate: '2026-07-24',
    weekdays: [5],
    endDate: '2026-08-07',
    mutationId: 'series',
    today: '2026-07-23',
  });

  const moved = reschedulePlannedWorkout(workouts, workouts[1].id, '2026-08-02', 'occurrence', 'member-1');

  assert.deepEqual(moved.map(({ date }) => date).sort(), ['2026-07-24', '2026-08-02', '2026-08-07']);
  assert.equal(moved.find(({ id }) => id === workouts[1].id).recurrenceSeriesId, undefined);
});

test('moves this-and-future recurring occurrences by the same day offset', () => {
  const workouts = planWorkoutTemplate({
    workouts: [],
    template,
    memberId: 'member-1',
    startDate: '2026-07-24',
    weekdays: [5],
    endDate: '2026-08-14',
    mutationId: 'series',
    today: '2026-07-23',
  });

  const moved = reschedulePlannedWorkout(workouts, workouts[1].id, '2026-08-02', 'future', 'member-1');

  assert.deepEqual(moved.map(({ date }) => date), ['2026-07-24', '2026-08-02', '2026-08-09', '2026-08-16']);
  assert.ok(moved.slice(1).every(({ recurrenceEndDate }) => recurrenceEndDate === '2026-08-16'));
});

test('keeps a past plan unresolved until it is skipped, moved, or completed late', () => {
  const [planned] = planWorkoutTemplate({
    workouts: [],
    template,
    memberId: 'member-1',
    startDate: '2026-07-20',
    mutationId: 'late',
    today: '2026-07-19',
  });

  assert.equal(workoutSchedule([planned], 'member-1', '2026-07-24')[0].resolution, 'unresolved');
  assert.equal(resolvePlannedWorkout([planned], planned.id, 'skipped', 'member-1')[0].status, 'skipped');
});

test('starts and completes a plan as one canonical Workout linked to its planned date', () => {
  const [planned] = planWorkoutTemplate({
    workouts: [],
    template,
    memberId: 'member-1',
    startDate: '2026-07-20',
    mutationId: 'late',
    today: '2026-07-19',
  });
  const started = startPlannedWorkout([planned], planned.id, 'member-1', '2026-07-24', '2026-07-24T08:00:00Z');
  const completed = { ...started[0], status: 'completed', completedAt: '2026-07-24T09:00:00Z' };
  const duplicated = { ...completed };

  const schedule = workoutSchedule([completed, duplicated], 'member-1', '2026-07-24');

  assert.equal(schedule.length, 1);
  assert.equal(schedule[0].workout.id, planned.id);
  assert.equal(schedule[0].workout.plannedDate, '2026-07-20');
  assert.equal(schedule[0].workout.date, '2026-07-24');
});

test('does not mutate another Member’s Schedule', () => {
  const [planned] = planWorkoutTemplate({
    workouts: [],
    template: { ...template, memberId: 'member-2' },
    memberId: 'member-2',
    startDate: '2026-07-25',
    mutationId: 'private',
    today: '2026-07-24',
  });

  assert.deepEqual(resolvePlannedWorkout([planned], planned.id, 'skipped', 'member-1'), [planned]);
  assert.deepEqual(reschedulePlannedWorkout([planned], planned.id, '2026-07-26', 'occurrence', 'member-1'), [planned]);
});

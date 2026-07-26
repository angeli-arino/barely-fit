import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allowedWorkoutReminderTime,
  reconcileWorkoutReminders,
  updatePlannedWorkoutReminder,
} from '../.test-build/src/domain/workoutReminders.js';

const plannedWorkout = {
  id: 'planned-1',
  memberId: 'member-1',
  name: 'Private workout name',
  date: '2026-07-28',
  status: 'planned',
  blocks: [],
};

test('schedules the default reminder and reschedules the same job when its date changes', () => {
  const first = reconcileWorkoutReminders({
    workouts: [plannedWorkout],
    defaultReminderTime: '08:00',
    existingJobs: [],
    now: '2026-07-26T00:00:00.000Z',
    timeZone: 'Pacific/Auckland',
  });

  assert.deepEqual(first, {
    cancelIds: [],
    upsertJobs: [{ id: 'planned-1', deadlineAt: '2026-07-27T20:00:00.000Z' }],
  });

  const moved = reconcileWorkoutReminders({
    workouts: [{ ...plannedWorkout, date: '2026-07-29' }],
    defaultReminderTime: '08:00',
    existingJobs: [{ id: 'planned-1', deadlineAt: '2026-07-27T20:00:00.000Z' }],
    now: '2026-07-26T00:00:00.000Z',
    timeZone: 'Pacific/Auckland',
  });

  assert.deepEqual(moved.upsertJobs, [{ id: 'planned-1', deadlineAt: '2026-07-28T20:00:00.000Z' }]);
});

test('uses an individual override and cancels skipped, disabled, expired, or denied reminders', () => {
  const existingJobs = [{ id: 'planned-1', deadlineAt: '2026-07-27T20:00:00.000Z' }];
  const shared = {
    defaultReminderTime: '08:00',
    existingJobs,
    now: '2026-07-26T00:00:00.000Z',
    timeZone: 'Pacific/Auckland',
  };

  assert.deepEqual(reconcileWorkoutReminders({
    ...shared,
    workouts: [{ ...plannedWorkout, reminderTime: '18:30' }],
  }).upsertJobs, [{ id: 'planned-1', deadlineAt: '2026-07-28T06:30:00.000Z' }]);

  for (const input of [
    { workouts: [{ ...plannedWorkout, status: 'skipped' }] },
    { workouts: [{ ...plannedWorkout, reminderTime: null }] },
    { workouts: [plannedWorkout], defaultReminderTime: allowedWorkoutReminderTime('denied', '08:00') },
    { workouts: [{ ...plannedWorkout, date: '2026-07-25' }] },
  ]) {
    assert.deepEqual(reconcileWorkoutReminders({ ...shared, ...input }), {
      cancelIds: ['planned-1'],
      upsertJobs: [],
    });
  }
});

test('only accepts a newly enabled reminder time after notification permission is granted', () => {
  assert.equal(allowedWorkoutReminderTime('granted', '08:00'), '08:00');
  assert.equal(allowedWorkoutReminderTime('denied', '08:00'), null);
  assert.equal(allowedWorkoutReminderTime('default', '08:00'), null);
  assert.equal(allowedWorkoutReminderTime('unsupported', '08:00'), null);
});

test('allows an already-enabled Member to edit reminder times from another device', () => {
  assert.equal(allowedWorkoutReminderTime('denied', '18:30', true), '18:30');
  assert.equal(allowedWorkoutReminderTime('unsupported', '18:30', true), '18:30');
});

test('does not cancel Member-wide jobs because the current device lacks permission', () => {
  assert.deepEqual(reconcileWorkoutReminders({
    workouts: [plannedWorkout],
    defaultReminderTime: '08:00',
    existingJobs: [{ id: 'planned-1', deadlineAt: '2026-07-27T20:00:00.000Z' }],
    now: '2026-07-26T00:00:00.000Z',
    timeZone: 'Pacific/Auckland',
  }), { cancelIds: [], upsertJobs: [] });
});

test('updates a reminder only for the Member’s Planned Workout', () => {
  const otherMember = { ...plannedWorkout, id: 'planned-2', memberId: 'member-2' };
  const completed = { ...plannedWorkout, id: 'completed-1', status: 'completed' };
  const workouts = [plannedWorkout, otherMember, completed];

  const updated = updatePlannedWorkoutReminder(workouts, 'planned-1', 'member-1', '18:30');
  assert.equal(updated[0].reminderTime, '18:30');
  assert.equal(updated[1], otherMember);
  assert.equal(updated[2], completed);

  assert.equal(updatePlannedWorkoutReminder(workouts, 'planned-2', 'member-1', null), workouts);
  assert.equal(updatePlannedWorkoutReminder(workouts, 'completed-1', 'member-1', null), workouts);
});

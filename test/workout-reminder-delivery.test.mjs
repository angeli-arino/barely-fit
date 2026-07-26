import assert from 'node:assert/strict';
import test from 'node:test';
import {
  notificationForWorkoutReminder,
  workoutReminderDeliveryResult,
} from '../.test-build/supabase/functions/_shared/workoutReminderDelivery.js';

test('uses generic lock-screen content without Workout details', () => {
  assert.deepEqual(notificationForWorkoutReminder(), {
    title: 'Planned Workout reminder',
    body: 'You have a Planned Workout coming up.',
    tag: 'workout-reminder',
  });
});

test('removes expired subscriptions and resolves the job from delivery outcomes', () => {
  assert.deepEqual(workoutReminderDeliveryResult([201, 410, 404]), {
    expiredIndexes: [1, 2],
    status: 'sent',
  });
  assert.deepEqual(workoutReminderDeliveryResult([410]), {
    expiredIndexes: [0],
    status: 'failed',
  });
  assert.deepEqual(workoutReminderDeliveryResult([503]), {
    expiredIndexes: [],
    status: 'pending',
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { adjustRestTimer, dismissRestTimer, nextRelevantSetLabel, remainingTimerSeconds, startRestTimer, tickRestTimer, toggleRestTimerPause, workoutDurationMinutes } from '../.test-build/src/domain/restTimer.js';

const timer = { active: false, remainingSec: 0, initialSec: 0, paused: false, sound: true, vibration: true };

test('rest timer uses a persisted deadline rather than decremented ticks', () => {
  const started = startRestTimer(timer, 90, 1_000, 'Back squat', 'Working Set 2');
  assert.equal(started.deadlineAt, 91_000);
  assert.equal(remainingTimerSeconds(started, 31_100), 60);
  assert.equal(tickRestTimer(started, 91_001).active, false);
  assert.equal(tickRestTimer(started, 91_001).endedBy, 'expired');
});

test('pausing and adjusting a deadline preserves the remaining rest', () => {
  const started = startRestTimer(timer, 60, 10_000, 'Row');
  const paused = toggleRestTimerPause(started, 30_400);
  assert.equal(paused.remainingSec, 40);
  const adjusted = adjustRestTimer(paused, 15, 50_000);
  const resumed = toggleRestTimerPause(adjusted, 50_000);
  assert.equal(resumed.deadlineAt, 105_000);
});

test('an expired timer completes instead of becoming paused forever', () => {
  const started = startRestTimer(timer, 10, 1_000, 'Row');
  assert.equal(toggleRestTimerPause(started, 11_100).active, false);
  assert.equal(toggleRestTimerPause(started, 11_100).endedBy, 'expired');
});

test('subtracting to zero dismisses without producing an expiry alert', () => {
  const started = startRestTimer(timer, 10, 1_000, 'Row');
  assert.equal(adjustRestTimer(started, -10, 1_000).endedBy, 'dismissed');
});

test('dismiss and Workout Duration calculations are deterministic', () => {
  const started = startRestTimer(timer, 30, 1_000, 'Row');
  assert.equal(dismissRestTimer(started).endedBy, 'dismissed');
  assert.equal(workoutDurationMinutes('2026-07-23T00:00:00.000Z', Date.parse('2026-07-23T00:42:29.000Z')), 42);
});

test('next Set guidance crosses Exercise Block boundaries', () => {
  const blocks = [
    { id: 'a', type: 'single', exercises: [{ id: 'row-item', exerciseId: 'row', restSec: 60, priorSummary: '', sets: [{ id: 'row-set', kind: 'working', completed: true }] }] },
    { id: 'b', type: 'single', exercises: [{ id: 'squat-item', exerciseId: 'squat', restSec: 90, priorSummary: '', sets: [{ id: 'squat-set', kind: 'working', completed: false }] }] },
  ];
  assert.equal(nextRelevantSetLabel(blocks, 'row-set', [{ id: 'squat', name: 'Back squat' }]), 'Back squat · Working Set 1');
});

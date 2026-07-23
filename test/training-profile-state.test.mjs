import assert from 'node:assert/strict';
import test from 'node:test';
import { applyTrainingProfileAction } from '../.test-build/src/state/trainingProfileState.js';
import { workoutRecommendationContext } from '../.test-build/src/domain/workoutRecommendations.js';

const profile = {
  loadUnit: 'kg',
  distanceUnit: 'km',
  primaryGoals: 'Build strength',
  availableEquipment: 'Barbell and rack',
  preferredWorkoutLengthMin: 60,
  weeklyFrequency: 4,
  preferredExercises: 'Back squat',
  avoidedExercises: 'Box jumps',
  physicalLimitations: '',
};

const workout = {
  id: 'workout-1',
  memberId: 'member-1',
  name: 'Strength',
  date: '2026-07-20',
  status: 'completed',
  blocks: [{
    id: 'block-1',
    type: 'single',
    exercises: [{
      id: 'item-1',
      exerciseId: 'back-squat',
      restSec: 120,
      priorSummary: '80 kg × 5',
      sets: [{
        id: 'set-1',
        kind: 'working',
        completed: true,
        load: 80,
        reps: 5,
      }],
    }],
  }],
};

test('saves Training Profile unit defaults offline without changing Workout History measurements', () => {
  const state = {
    trainingProfile: profile,
    raceGoals: [],
    workouts: [workout],
    syncState: 'offline',
  };

  const result = applyTrainingProfileAction(state, {
    type: 'save-training-profile',
    profile: {
      ...profile,
      loadUnit: 'lb',
      distanceUnit: 'mi',
      weeklyFrequency: 5,
    },
  });

  assert.equal(result.trainingProfile.loadUnit, 'lb');
  assert.equal(result.trainingProfile.distanceUnit, 'mi');
  assert.equal(result.trainingProfile.weeklyFrequency, 5);
  assert.equal(result.syncState, 'offline');
  assert.deepEqual(result.workouts, [workout]);
  assert.equal(result.workouts[0].blocks[0].exercises[0].sets[0].load, 80);
});

test('adds, updates, and removes Race Goals without changing another Race Goal', () => {
  const state = {
    trainingProfile: profile,
    raceGoals: [{
      id: 'race-1',
      eventName: 'Auckland Half Marathon',
      date: '2026-11-01',
      distanceKm: 21.1,
      targetTime: '2:15:00',
    }],
    workouts: [],
    syncState: 'synced',
  };

  const added = applyTrainingProfileAction(state, {
    type: 'save-race-goal',
    today: '2026-07-24',
    raceGoal: {
      id: 'race-2',
      eventName: 'Waterfront 5K',
      date: '2027-02-14',
      distanceKm: 5,
    },
  });
  const updated = applyTrainingProfileAction(added, {
    type: 'save-race-goal',
    today: '2026-07-24',
    raceGoal: {
      ...added.raceGoals[1],
      targetTime: '00:24:30',
    },
  });
  const removed = applyTrainingProfileAction(updated, {
    type: 'delete-race-goal',
    raceGoalId: 'race-1',
  });

  assert.equal(added.raceGoals.length, 2);
  assert.equal(updated.raceGoals[0], state.raceGoals[0]);
  assert.equal(updated.raceGoals[1].targetTime, '00:24:30');
  assert.deepEqual(removed.raceGoals.map(({ id }) => id), ['race-2']);
  assert.equal(removed.syncState, 'syncing');
});

test('does not persist an incomplete Race Goal', () => {
  const state = {
    trainingProfile: profile,
    raceGoals: [],
    workouts: [],
    syncState: 'synced',
  };

  const result = applyTrainingProfileAction(state, {
    type: 'save-race-goal',
    today: '2026-07-24',
    raceGoal: {
      id: 'race-invalid',
      eventName: ' ',
      date: '',
      distanceKm: 0,
    },
  });

  assert.deepEqual(result.raceGoals, []);
  assert.equal(result.syncState, 'synced');
  assert.equal(result.toast, 'Enter an event name, upcoming date, and distance greater than zero.');
});

test('does not persist a Race Goal with a past or impossible date', () => {
  const state = {
    trainingProfile: profile,
    raceGoals: [],
    workouts: [],
    syncState: 'synced',
  };

  for (const date of ['2026-07-23', '2026-02-30']) {
    const result = applyTrainingProfileAction(state, {
      type: 'save-race-goal',
      today: '2026-07-24',
      raceGoal: {
        id: date,
        eventName: 'Race',
        date,
        distanceKm: 5,
      },
    });

    assert.deepEqual(result.raceGoals, []);
  }
});

test('creates the private future Workout Recommendation boundary without exposing Workout History', () => {
  const context = workoutRecommendationContext({
    trainingProfile: profile,
    raceGoals: [
      { id: 'past', eventName: 'Past 5K', date: '2026-07-01', distanceKm: 5 },
      { id: 'future', eventName: 'Future 10K', date: '2026-09-01', distanceKm: 10 },
    ],
  }, '2026-07-24');

  assert.deepEqual(context.trainingProfile, profile);
  assert.deepEqual(context.upcomingRaceGoals.map(({ id }) => id), ['future']);
  assert.equal('workouts' in context, false);
  assert.notEqual(context.trainingProfile, profile);
});

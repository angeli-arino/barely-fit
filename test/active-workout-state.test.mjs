import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addSetToExercise,
  moveExerciseBlock,
  replaceExerciseInWorkout,
  updateTemplateFromWorkout,
} from '../.test-build/src/domain/activeWorkout.js';

const set = (id, overrides = {}) => ({ id, kind: 'working', completed: false, targetReps: 8, ...overrides });
const item = (id, exerciseId, sets = [set(`${id}-set`)]) => ({ id, exerciseId, restSec: 90, priorSummary: 'None', sets });
const block = (id, exercises) => ({ id, type: 'single', exercises });
const workout = (blocks) => ({ id: 'workout-1', memberId: 'member-1', name: 'Workout', date: '2026-07-23', status: 'active', blocks });

test('reorders Exercise Blocks without changing completed work', () => {
  const first = block('first', [item('first-item', 'squat', [set('completed', { completed: true, reps: 8 })])]);
  const second = block('second', [item('second-item', 'row')]);

  const result = moveExerciseBlock(workout([first, second]), 'first', 1);

  assert.deepEqual(result.blocks.map(({ id }) => id), ['second', 'first']);
  assert.deepEqual(result.blocks[1].exercises[0].sets[0], first.exercises[0].sets[0]);
});

test('replaces only the remaining Sets while retaining completed work with its original Exercise', () => {
  const recorded = set('recorded', { completed: true, reps: 10, load: 42.5 });
  const remaining = set('remaining');
  const source = workout([block('block-1', [item('item-1', 'squat', [recorded, remaining])])]);

  const result = replaceExerciseInWorkout(source, 'item-1', 'deadlift', 'deadlift-item');

  assert.equal(result.blocks[0].exercises[0].exerciseId, 'squat');
  assert.deepEqual(result.blocks[0].exercises[0].sets, [recorded]);
  assert.equal(result.blocks[0].exercises[1].exerciseId, 'deadlift');
  assert.deepEqual(result.blocks[0].exercises[1].sets, [remaining]);
  assert.equal(source.blocks[0].exercises[0].exerciseId, 'squat');
});

test('adds an incomplete Set using the previous Set Target', () => {
  const source = workout([block('block-1', [item('item-1', 'squat', [set('first', { targetReps: 6, targetLoad: 80 })])])]);

  const result = addSetToExercise(source, 'item-1', 'extra-set');

  const added = result.blocks[0].exercises[0].sets.at(-1);
  assert.equal(added.id, 'extra-set');
  assert.equal(added.completed, false);
  assert.equal(added.targetReps, 6);
  assert.equal(added.targetLoad, 80);
});

test('updates a Workout Template only when explicitly requested', () => {
  const template = { id: 'template-1', memberId: 'member-1', name: 'Original', estimatedMin: 45, focus: 'Strength', updatedAt: '2026-07-01', blocks: [block('template-block', [item('template-item', 'squat')])] };
  const completedWorkout = { ...workout([block('workout-block', [item('workout-item', 'deadlift', [set('logged', { completed: true, reps: 5, load: 100 })])])]), status: 'completed', templateId: 'template-1', name: 'Updated' };

  const updated = updateTemplateFromWorkout(template, completedWorkout, '2026-07-23');

  assert.equal(updated.name, 'Updated');
  assert.equal(updated.blocks[0].exercises[0].exerciseId, 'deadlift');
  const templateSet = updated.blocks[0].exercises[0].sets[0];
  assert.equal(templateSet.completed, false);
  assert.equal(templateSet.targetReps, 5);
  assert.equal(templateSet.targetLoad, 100);
  assert.equal(templateSet.reps, undefined);
  assert.equal(templateSet.load, undefined);
  assert.equal(template.blocks[0].exercises[0].exerciseId, 'squat');
});

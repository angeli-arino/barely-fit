import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Exercise, RaceGoal, RestTimerState, SetMeasurements, SyncState, TodayScenario, TrainingProfile, Workout, WorkoutTemplate } from '../types';
import { initialWorkouts, prototypeMemberId, templates as baseTemplates } from '../data/mockData';
import { exerciseLookup } from '../data/catalog';
import { canDeleteCustomExercise, createCustomExercise, updateCustomExercise, type CustomExerciseInput } from '../domain/customExercises';
import { addExerciseToBlock, addSetToExercise, moveExerciseBlock, replaceExerciseInWorkout, updateTemplateFromWorkout } from '../domain/activeWorkout';
import { adjustRestTimer, dismissRestTimer, startRestTimer, tickRestTimer, toggleRestTimerPause, workoutDurationMinutes } from '../domain/restTimer';
import { chooseRecoveredHistory, correctCompletedWorkout, deleteCompletedWorkout, recoveredHistorySyncState, restoreDeletedWorkout } from '../domain/workoutHistory';
import { planWorkoutTemplate, reschedulePlannedWorkout, resolvePlannedWorkout, startPlannedWorkout } from '../domain/workoutSchedule';
import { supabase, supabaseConfigurationError, validateMemberSession } from '../lib/supabase';
import { syncRestNotificationJob } from '../lib/restNotifications';
import { syncWorkoutReminderJobs } from '../lib/workoutReminders';
import { updatePlannedWorkoutReminder } from '../domain/workoutReminders';
import { clearPersistedOutbox, loadPersistedStateSnapshot, savePersistedState } from './persistence';
import { loadRemoteState, saveRemoteState } from './remoteState';
import { applyTrainingProfileAction, syncAfterLocalEdit } from './trainingProfileState';

interface AppState {
  authenticated: boolean;
  memberId?: string;
  loading: boolean;
  syncState: SyncState;
  todayScenario: TodayScenario;
  workouts: Workout[];
  templates: WorkoutTemplate[];
  exercises: Exercise[];
  trainingProfile: TrainingProfile;
  raceGoals: RaceGoal[];
  restTimer: RestTimerState;
  toast?: string;
  deletedWorkout?: Workout;
}

type Action =
  | { type: 'hydrate'; payload: Partial<AppState> }
  | { type: 'session-signed-out' }
  | { type: 'notify'; message: string }
  | { type: 'set-loading'; value: boolean }
  | { type: 'set-sync'; value: SyncState }
  | { type: 'set-scenario'; value: TodayScenario }
  | { type: 'start-template'; templateId: string }
  | { type: 'update-set-draft'; itemId: string; setId: string; values: Partial<SetMeasurements> }
  | { type: 'complete-set'; itemId: string; setId: string; values: Partial<SetMeasurements>; exerciseName: string; restSec: number; nextSetLabel?: string }
  | { type: 'add-set'; itemId: string }
  | { type: 'remove-set'; itemId: string; setId: string }
  | { type: 'move-set'; itemId: string; setId: string; direction: -1 | 1 }
  | { type: 'move-block'; blockId: string; direction: -1 | 1 }
  | { type: 'move-exercise'; itemId: string; direction: -1 | 1 }
  | { type: 'set-block-type'; blockId: string; blockType: Workout['blocks'][number]['type'] }
  | { type: 'finish-workout' }
  | { type: 'discard-workout' }
  | { type: 'timer-tick' }
  | { type: 'timer-adjust'; seconds: number }
  | { type: 'timer-pause' }
  | { type: 'timer-skip' }
  | { type: 'timer-sound' }
  | { type: 'timer-vibration' }
  | { type: 'update-planned-workout'; workoutId: string; status: Workout['status']; date?: string }
  | { type: 'reschedule-planned-workout'; workoutId: string; date: string; scope: 'occurrence' | 'future' }
  | { type: 'start-planned-workout'; workoutId: string; performedDate: string }
  | { type: 'update-workout-reminder'; workoutId: string; reminderTime: string | null | undefined }
  | { type: 'add-planned-workout'; templateId: string; date: string; weekdays?: number[]; endDate?: string; mutationId: string; today: string }
  | { type: 'save-template'; template: WorkoutTemplate }
  | { type: 'save-training-profile'; profile: TrainingProfile }
  | { type: 'save-race-goal'; raceGoal: RaceGoal; today: string }
  | { type: 'delete-race-goal'; raceGoalId: string }
  | { type: 'update-template-from-workout'; workoutId: string }
  | { type: 'add-custom-exercise'; exercise: Exercise }
  | { type: 'create-custom-exercise'; input: CustomExerciseInput }
  | { type: 'edit-custom-exercise'; exerciseId: string; input: CustomExerciseInput }
  | { type: 'delete-custom-exercise'; exerciseId: string }
  | { type: 'add-exercise-to-active'; exerciseId: string }
  | { type: 'add-exercise-to-active-block'; blockId: string; exerciseId: string }
  | { type: 'replace-exercise-in-active'; itemId: string; exerciseId: string }
  | { type: 'remove-exercise-from-active'; itemId: string }
  | { type: 'correct-completed-workout'; workout: Workout }
  | { type: 'delete-workout'; workoutId: string }
  | { type: 'undo-delete' }
  | { type: 'clear-toast' };

const initialTimer: RestTimerState = {
  active: false,
  remainingSec: 0,
  initialSec: 0,
  paused: false,
  sound: true,
  vibration: true,
};

const defaultState: AppState = {
  authenticated: false,
  loading: true,
  syncState: 'synced',
  todayScenario: 'active',
  workouts: initialWorkouts,
  templates: baseTemplates,
  exercises: exerciseLookup,
  trainingProfile: {
    loadUnit: 'kg',
    distanceUnit: 'km',
    primaryGoals: 'Strength + half marathon',
    availableEquipment: 'Full gym, barbells, machines, dumbbells, bands',
    preferredWorkoutLengthMin: 60,
    weeklyFrequency: 6,
    preferredExercises: 'Back squat, RDL, cable row, easy run',
    avoidedExercises: 'Assisted pull-ups when shoulder is painful',
    physicalLimitations: 'Monitor medial knee discomfort and shoulder pain. No running on heavy leg days.',
  },
  raceGoals: [{ id: 'auckland-half-2026', eventName: 'Auckland Half Marathon', date: '2026-11-01', distanceKm: 21.1, targetTime: '2:15:00' }],
  restTimer: initialTimer,
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function seededStateForMember(memberId: string): AppState {
  const seeded = clone(defaultState);
  return {
    ...seeded,
    authenticated: true,
    loading: false,
    memberId,
    workouts: seeded.workouts.map((workout) => ({ ...workout, memberId })),
    templates: seeded.templates.map((template) => ({ ...template, memberId })),
    exercises: seeded.exercises.map((exercise) => exercise.createdByMemberId === prototypeMemberId
      ? { ...exercise, createdByMemberId: memberId }
      : exercise),
  };
}

function updateActiveWorkout(state: AppState, updater: (workout: Workout) => Workout): Workout[] {
  return state.workouts.map((workout) => (workout.status === 'active' ? updater(workout) : workout));
}

function updateActiveSet(state: AppState, itemId: string, setId: string, updater: (set: Workout['blocks'][number]['exercises'][number]['sets'][number]) => Workout['blocks'][number]['exercises'][number]['sets'][number]) {
  return updateActiveWorkout(state, (workout) => ({
    ...workout,
    blocks: workout.blocks.map((block) => ({
      ...block,
      exercises: block.exercises.map((item) => item.id !== itemId ? item : ({
        ...item,
        sets: item.sets.map((set) => set.id === setId ? updater(set) : set),
      })),
    })),
  }));
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, loading: false };
    case 'session-signed-out':
      return { ...clone(defaultState), loading: false };
    case 'notify':
      return { ...state, toast: action.message };
    case 'set-loading':
      return { ...state, loading: action.value };
    case 'set-sync':
      return { ...state, syncState: action.value };
    case 'set-scenario':
      return { ...state, todayScenario: action.value };
    case 'start-template': {
      const source = state.templates.find((template) => template.id === action.templateId);
      if (!source) return state;
      const existingActive = state.workouts.some((workout) => workout.status === 'active');
      if (existingActive) return { ...state, toast: 'Resume or finish the current workout first.' };
      const active: Workout = {
        id: `active-${Date.now()}`,
        memberId: state.memberId ?? prototypeMemberId,
        templateId: source.id,
        name: source.name,
        date: '2026-07-23',
        startedAt: new Date().toISOString(),
        status: 'active',
        blocks: clone(source.blocks),
      };
      return { ...state, workouts: [active, ...state.workouts], syncState: syncAfterLocalEdit(state), todayScenario: 'active' };
    }
    case 'update-set-draft':
      return {
        ...state,
        workouts: updateActiveSet(state, action.itemId, action.setId, (set) => ({ ...set, ...action.values })),
        syncState: syncAfterLocalEdit(state),
      };
    case 'complete-set': {
      const completedAt = new Date().toISOString();
      const workouts = updateActiveSet(state, action.itemId, action.setId, (set) => ({ ...set, ...action.values, completed: true, completedAt }));
      return {
        ...state,
        workouts,
        syncState: syncAfterLocalEdit(state),
        restTimer: startRestTimer(state.restTimer, action.restSec, Date.now(), action.exerciseName, action.nextSetLabel, crypto.randomUUID()),
      };
    }
    case 'add-set': {
      const workouts = updateActiveWorkout(state, (workout) => addSetToExercise(workout, action.itemId, `${action.itemId}-set-${Date.now()}`));
      return { ...state, workouts, syncState: syncAfterLocalEdit(state), toast: 'Set added.' };
    }
    case 'remove-set': {
      const workouts = updateActiveWorkout(state, (workout) => ({
        ...workout,
        blocks: workout.blocks.map((block) => ({
          ...block,
          exercises: block.exercises.map((item) => item.id !== action.itemId ? item : ({ ...item, sets: item.sets.filter((set) => set.id !== action.setId) })),
        })),
      }));
      return { ...state, workouts, syncState: syncAfterLocalEdit(state), toast: 'Set removed from this Workout.' };
    }
    case 'move-set': {
      const workouts = updateActiveWorkout(state, (workout) => ({
        ...workout,
        blocks: workout.blocks.map((block) => ({
          ...block,
          exercises: block.exercises.map((item) => {
            if (item.id !== action.itemId) return item;
            const sets = [...item.sets];
            const index = sets.findIndex((set) => set.id === action.setId);
            const next = index + action.direction;
            if (index < 0 || next < 0 || next >= sets.length) return item;
            [sets[index], sets[next]] = [sets[next], sets[index]];
            return { ...item, sets };
          }),
        })),
      }));
      return { ...state, workouts, syncState: syncAfterLocalEdit(state) };
    }
    case 'move-block': {
      const workouts = updateActiveWorkout(state, (workout) => moveExerciseBlock(workout, action.blockId, action.direction));
      return { ...state, workouts, syncState: syncAfterLocalEdit(state), toast: 'Exercise order updated.' };
    }
    case 'move-exercise': {
      const workouts = updateActiveWorkout(state, (workout) => ({
        ...workout,
        blocks: workout.blocks.map((block) => {
          const exercises = [...block.exercises];
          const index = exercises.findIndex((item) => item.id === action.itemId);
          const next = index + action.direction;
          if (index < 0 || next < 0 || next >= exercises.length) return block;
          [exercises[index], exercises[next]] = [exercises[next], exercises[index]];
          return { ...block, exercises };
        }),
      }));
      return { ...state, workouts, syncState: syncAfterLocalEdit(state), toast: 'Exercise order updated.' };
    }
    case 'set-block-type':
      return {
        ...state,
        workouts: updateActiveWorkout(state, (workout) => ({
          ...workout,
          blocks: workout.blocks.map((block) => block.id === action.blockId ? ({ ...block, type: action.blockType, rounds: action.blockType === 'rounds' ? (block.rounds ?? 3) : undefined }) : block),
        })),
        syncState: syncAfterLocalEdit(state),
        toast: 'Exercise Block updated.',
      };
    case 'finish-workout': {
      const now = new Date().toISOString();
      const workouts = state.workouts.map((workout) => workout.status !== 'active' ? workout : ({
        ...workout,
        status: 'completed' as const,
        completedAt: now,
        durationMin: workoutDurationMinutes(workout.startedAt, Date.now()),
      }));
      return { ...state, workouts, restTimer: dismissRestTimer(state.restTimer), syncState: syncAfterLocalEdit(state), todayScenario: 'planned', toast: 'Workout finished. Progress recalculated.' };
    }
    case 'discard-workout':
      return { ...state, workouts: state.workouts.filter((workout) => workout.status !== 'active'), restTimer: dismissRestTimer(state.restTimer), syncState: syncAfterLocalEdit(state), todayScenario: 'planned', toast: 'Active workout discarded.' };
    case 'timer-tick':
      if (!state.restTimer.active || state.restTimer.paused) return state;
      {
        const restTimer = tickRestTimer(state.restTimer, Date.now());
        return { ...state, restTimer, toast: !restTimer.active ? 'Rest complete. Next set is ready.' : state.toast };
      }
    case 'timer-adjust':
      return { ...state, restTimer: adjustRestTimer(state.restTimer, action.seconds, Date.now()) };
    case 'timer-pause':
      return { ...state, restTimer: toggleRestTimerPause(state.restTimer, Date.now()) };
    case 'timer-skip':
      return { ...state, restTimer: dismissRestTimer(state.restTimer), toast: 'Rest skipped.' };
    case 'timer-sound':
      return { ...state, restTimer: { ...state.restTimer, sound: !state.restTimer.sound } };
    case 'timer-vibration':
      return { ...state, restTimer: { ...state.restTimer, vibration: !state.restTimer.vibration } };
    case 'update-planned-workout':
      return {
        ...state,
        workouts: action.status === 'skipped'
          ? resolvePlannedWorkout(state.workouts, action.workoutId, 'skipped', state.memberId ?? '')
          : state.workouts.map((workout) => workout.id !== action.workoutId || workout.memberId !== state.memberId ? workout : ({ ...workout, status: action.status, date: action.date ?? workout.date })),
        syncState: syncAfterLocalEdit(state),
        toast: action.status === 'skipped' ? 'Workout marked skipped.' : action.date ? 'Planned Workout rescheduled.' : 'Planned Workout updated.',
      };
    case 'reschedule-planned-workout': {
      const workouts = reschedulePlannedWorkout(state.workouts, action.workoutId, action.date, action.scope, state.memberId ?? '');
      if (workouts === state.workouts) return state;
      return { ...state, workouts, syncState: syncAfterLocalEdit(state), toast: action.scope === 'future' ? 'This and future Planned Workouts moved.' : 'Planned Workout moved.' };
    }
    case 'start-planned-workout': {
      if (state.workouts.some((workout) => workout.status === 'active')) return { ...state, toast: 'Resume or finish the current Active Workout first.' };
      const workouts = startPlannedWorkout(state.workouts, action.workoutId, state.memberId ?? '', action.performedDate, new Date().toISOString());
      if (workouts === state.workouts) return state;
      return {
        ...state,
        workouts,
        syncState: syncAfterLocalEdit(state),
        todayScenario: 'active',
      };
    }
    case 'update-workout-reminder': {
      const workouts = updatePlannedWorkoutReminder(state.workouts, action.workoutId, state.memberId ?? '', action.reminderTime);
      if (workouts === state.workouts) return state;
      return {
        ...state,
        workouts,
        syncState: syncAfterLocalEdit(state),
        toast: 'Workout reminder updated.',
      };
    }
    case 'add-planned-workout': {
      const source = state.templates.find((template) => template.id === action.templateId && template.memberId === state.memberId);
      if (!source || !state.memberId) return state;
      const workouts = planWorkoutTemplate({
        workouts: state.workouts,
        template: source,
        memberId: state.memberId,
        startDate: action.date,
        weekdays: action.weekdays,
        endDate: action.endDate,
        mutationId: action.mutationId,
        today: action.today,
      });
      return { ...state, workouts, syncState: syncAfterLocalEdit(state), toast: action.weekdays?.length ? 'Recurring Planned Workouts added to the Workout Schedule.' : 'Planned Workout added to the Workout Schedule.' };
    }
    case 'save-template':
      return {
        ...state,
        templates: state.templates.some((template) => template.id === action.template.id)
          ? state.templates.map((template) => template.id === action.template.id ? action.template : template)
          : [...state.templates, action.template],
        syncState: syncAfterLocalEdit(state),
        toast: 'Workout Template saved.',
      };
    case 'save-training-profile':
      return applyTrainingProfileAction(state, action);
    case 'save-race-goal':
    case 'delete-race-goal':
      return applyTrainingProfileAction(state, action);
    case 'update-template-from-workout': {
      const workout = state.workouts.find((candidate) => candidate.id === action.workoutId);
      if (!workout?.templateId) return { ...state, toast: 'This Workout has no source Workout Template.' };
      return {
        ...state,
        templates: state.templates.map((template) => template.id === workout.templateId
          ? updateTemplateFromWorkout(template, workout, new Date().toISOString().slice(0, 10))
          : template),
        syncState: syncAfterLocalEdit(state),
        toast: 'Workout Template updated from this completed Workout.',
      };
    }
    case 'add-custom-exercise':
      return { ...state, exercises: [...state.exercises, action.exercise], syncState: syncAfterLocalEdit(state), toast: 'Private Custom Exercise created.' };
    case 'create-custom-exercise': {
      try { const exercise = createCustomExercise(action.input, state.memberId ?? prototypeMemberId, `custom-${Date.now()}`); if (state.exercises.some((item) => item.name.toLowerCase() === exercise.name.toLowerCase())) return { ...state, toast: 'Choose a unique Exercise name.' }; return { ...state, exercises: [...state.exercises, exercise], syncState: syncAfterLocalEdit(state), toast: 'Private Custom Exercise created.' }; } catch (error) { return { ...state, toast: error instanceof Error ? error.message : 'Could not create Custom Exercise.' }; }
    }
    case 'edit-custom-exercise': {
      const current = state.exercises.find((exercise) => exercise.id === action.exerciseId); if (!current) return state;
      try { return { ...state, exercises: state.exercises.map((exercise) => exercise.id === current.id ? updateCustomExercise(current, action.input, state.memberId ?? prototypeMemberId) : exercise), syncState: syncAfterLocalEdit(state), toast: 'Custom Exercise updated.' }; } catch (error) { return { ...state, toast: error instanceof Error ? error.message : 'Could not update Custom Exercise.' }; }
    }
    case 'delete-custom-exercise': { const exercise = state.exercises.find((item) => item.id === action.exerciseId); return exercise && canDeleteCustomExercise(exercise, state.workouts, state.memberId ?? prototypeMemberId) ? { ...state, exercises: state.exercises.filter((item) => item.id !== exercise.id), syncState: syncAfterLocalEdit(state), toast: 'Custom Exercise deleted.' } : { ...state, toast: 'This Custom Exercise is used by Workout History and cannot be deleted.' }; }
    case 'add-exercise-to-active': {
      const exercise = state.exercises.find((candidate) => candidate.id === action.exerciseId);
      if (!exercise) return state;
      const newBlock = {
        id: `added-block-${Date.now()}`,
        type: 'single' as const,
        exercises: [{
          id: `added-item-${Date.now()}`,
          exerciseId: exercise.id,
          restSec: exercise.defaultRestSec ?? 90,
          priorSummary: 'No prior performance in this workout',
          sets: [
            { id: `added-set-1-${Date.now()}`, kind: 'working' as const, targetReps: exercise.measurementType.includes('reps') ? 10 : undefined, targetDurationSec: exercise.measurementType.includes('duration') ? 60 : undefined, targetDistanceKm: exercise.measurementType.includes('distance') ? 1 : undefined, completed: false },
            { id: `added-set-2-${Date.now()}`, kind: 'working' as const, targetReps: exercise.measurementType.includes('reps') ? 10 : undefined, targetDurationSec: exercise.measurementType.includes('duration') ? 60 : undefined, targetDistanceKm: exercise.measurementType.includes('distance') ? 1 : undefined, completed: false },
            { id: `added-set-3-${Date.now()}`, kind: 'working' as const, targetReps: exercise.measurementType.includes('reps') ? 10 : undefined, targetDurationSec: exercise.measurementType.includes('duration') ? 60 : undefined, targetDistanceKm: exercise.measurementType.includes('distance') ? 1 : undefined, completed: false },
          ],
        }],
      };
      return { ...state, workouts: updateActiveWorkout(state, (workout) => ({ ...workout, blocks: [...workout.blocks, newBlock] })), syncState: syncAfterLocalEdit(state), toast: `${exercise.name} added to the Active Workout.` };
    }
    case 'replace-exercise-in-active': {
      const exercise = state.exercises.find((candidate) => candidate.id === action.exerciseId);
      if (!exercise) return state;
      return {
        ...state,
        workouts: updateActiveWorkout(state, (workout) => replaceExerciseInWorkout(workout, action.itemId, exercise.id, exercise.defaultRestSec ?? 90, `${action.itemId}-replacement-${Date.now()}`)),
        syncState: syncAfterLocalEdit(state),
        toast: `${exercise.name} replaced the Exercise in this Active Workout.`,
      };
    }
    case 'add-exercise-to-active-block': {
      const exercise = state.exercises.find((candidate) => candidate.id === action.exerciseId);
      if (!exercise) return state;
      const activeWorkout = state.workouts.find((workout) => workout.status === 'active');
      if (!activeWorkout?.blocks.some((block) => block.id === action.blockId)) return { ...state, toast: 'That Exercise Block is no longer available.' };
      const now = Date.now();
      const item = {
        id: `added-item-${now}`,
        exerciseId: exercise.id,
        restSec: exercise.defaultRestSec ?? 90,
        priorSummary: 'No prior performance in this Workout',
        sets: [{ id: `added-set-${now}`, kind: 'working' as const, targetReps: exercise.measurementType.includes('reps') ? 10 : undefined, targetDurationSec: exercise.measurementType.includes('duration') ? 60 : undefined, targetDistanceKm: exercise.measurementType.includes('distance') ? 1 : undefined, completed: false }],
      };
      return { ...state, workouts: updateActiveWorkout(state, (workout) => addExerciseToBlock(workout, action.blockId, item)), syncState: syncAfterLocalEdit(state), toast: `${exercise.name} added to this Exercise Block.` };
    }
    case 'remove-exercise-from-active': {
      const workouts = updateActiveWorkout(state, (workout) => ({
        ...workout,
        blocks: workout.blocks
          .map((block) => ({ ...block, exercises: block.exercises.filter((item) => item.id !== action.itemId) }))
          .filter((block) => block.exercises.length > 0),
      }));
      return { ...state, workouts, syncState: syncAfterLocalEdit(state), toast: 'Exercise removed from this Workout.' };
    }
    case 'correct-completed-workout': {
      const result = correctCompletedWorkout(state.workouts, action.workout, state.memberId ?? prototypeMemberId);
      if (!result.corrected) return { ...state, toast: result.error ?? 'Workout correction was not saved.' };
      return {
        ...state,
        workouts: result.workouts,
        toast: 'Workout correction saved. Progress recalculated.',
        syncState: syncAfterLocalEdit(state),
      };
    }
    case 'delete-workout': {
      const result = deleteCompletedWorkout(state.workouts, action.workoutId, state.memberId ?? prototypeMemberId);
      if (!result.deletedWorkout) return { ...state, toast: 'Only your own completed Workout can be deleted.' };
      return { ...state, workouts: result.workouts, deletedWorkout: result.deletedWorkout, syncState: syncAfterLocalEdit(state), toast: 'Workout deleted. Undo available.' };
    }
    case 'undo-delete':
      if (!state.deletedWorkout) return state;
      return { ...state, workouts: restoreDeletedWorkout(state.workouts, state.deletedWorkout), deletedWorkout: undefined, syncState: syncAfterLocalEdit(state), toast: 'Workout restored. Progress recalculated.' };
    case 'clear-toast':
      return { ...state, toast: undefined, deletedWorkout: undefined };
    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  activeWorkout?: Workout;
  dispatch: React.Dispatch<Action>;
  requestSync: () => void;
  signIn: (email: string, password: string) => Promise<string | undefined>;
  signOut: () => Promise<void>;
  authConfigurationError?: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const persistenceRevision = useRef(0);
  const wasResting = useRef(false);
  const syncedNotificationJob = useRef<string | undefined>(undefined);
  const lastWorkoutRemindersSignature = useRef('');
  const notificationSyncQueue = useRef(Promise.resolve());
  const [notificationRetry, setNotificationRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!supabase) {
      dispatch({ type: 'session-signed-out' });
      return () => { cancelled = true; };
    }
    const supabaseClient = supabase;

    const hydrateMember = async (memberId: string) => {
      dispatch({ type: 'set-loading', value: true });
      const local = await loadPersistedStateSnapshot<AppState>(memberId).catch(() => undefined);
      let remote: { value: Partial<AppState>; updatedAt: string } | undefined;
      let remoteUnavailable = false;
      try {
        remote = await loadRemoteState<Partial<AppState>>(memberId);
      } catch {
        remoteUnavailable = true;
      }
      if (cancelled) return;
      // A pending local mutation must replay. Otherwise the newest timestamp
      // wins so a stale device cache cannot overwrite newer remote History.
      const source = chooseRecoveredHistory(local ? { updatedAt: local.updatedAt, pending: local.pending } : undefined, remote?.updatedAt);
      const stored = source === 'local' ? local?.value : source === 'remote' ? remote?.value : undefined;
      dispatch({
        type: 'hydrate',
        payload: {
          ...seededStateForMember(memberId),
          ...stored,
          authenticated: true,
          memberId,
          syncState: source === 'local'
            ? recoveredHistorySyncState(true, remoteUnavailable, Boolean(remote), navigator.onLine)
            : remoteUnavailable ? 'offline' : source === 'remote' ? 'synced' : 'syncing',
        },
      });
    };

    const validateAndHydrate = async (memberId: string, shouldHydrate: boolean) => {
      const sessionStatus = await validateMemberSession();
      if (cancelled) return;
      if (sessionStatus === 'revoked') {
        await supabaseClient.auth.signOut({ scope: 'local' });
        if (!cancelled) dispatch({ type: 'session-signed-out' });
      } else if (shouldHydrate) {
        void hydrateMember(memberId);
      }
    };

    void supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) void validateAndHydrate(data.session.user.id, true);
      else if (!cancelled) dispatch({ type: 'session-signed-out' });
    }).catch(() => {
      if (!cancelled) dispatch({ type: 'session-signed-out' });
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) dispatch({ type: 'session-signed-out' });
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) void validateAndHydrate(session.user.id, event === 'SIGNED_IN');
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state.loading || !state.authenticated || !state.memberId) return;
    const persistable = {
      authenticated: state.authenticated,
      syncState: state.syncState,
      todayScenario: state.todayScenario,
      workouts: state.workouts,
      templates: state.templates,
      exercises: state.exercises,
      trainingProfile: state.trainingProfile,
      raceGoals: state.raceGoals,
      restTimer: state.restTimer,
    };
    const queueForSync = state.syncState === 'syncing' || state.syncState === 'offline';
    const revision = ++persistenceRevision.current;
    void savePersistedState(state.memberId, persistable, queueForSync).then(async (savedAt) => {
      if (revision === persistenceRevision.current && state.syncState !== 'synced') dispatch({ type: 'notify', message: 'Saved locally.' });
      if (state.syncState !== 'syncing') return;
      try {
        await saveRemoteState(state.memberId!, persistable);
        if (revision !== persistenceRevision.current) return;
        await clearPersistedOutbox(state.memberId!, savedAt);
        dispatch({ type: 'set-sync', value: 'synced' });
      } catch {
        if (revision === persistenceRevision.current) dispatch({ type: 'set-sync', value: 'error' });
      }
    }).catch(() => {
      if (state.syncState !== 'offline' && state.syncState !== 'error') dispatch({ type: 'set-sync', value: 'error' });
    });
  }, [state.authenticated, state.exercises, state.loading, state.memberId, state.raceGoals, state.restTimer, state.syncState, state.templates, state.todayScenario, state.trainingProfile, state.workouts]);

  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'timer-tick' }), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (wasResting.current && !state.restTimer.active && state.restTimer.remainingSec === 0 && state.restTimer.endedBy === 'expired') {
      if (state.restTimer.vibration) navigator.vibrate?.([120, 80, 120]);
      if (state.restTimer.sound && 'AudioContext' in window) {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        oscillator.connect(audio.destination);
        oscillator.frequency.value = 880;
        oscillator.addEventListener('ended', () => void audio.close());
        oscillator.start();
        oscillator.stop(audio.currentTime + 0.18);
      }
    }
    wasResting.current = state.restTimer.active;
  }, [state.restTimer.active, state.restTimer.remainingSec, state.restTimer.sound, state.restTimer.vibration, state.restTimer.endedBy]);

  useEffect(() => {
    if (!state.memberId || !state.restTimer.notificationJobId) return;
    const signature = `${state.restTimer.cancelledNotificationJobId ?? 'none'}:${state.restTimer.notificationJobId}:${state.restTimer.deadlineAt ?? state.restTimer.endedBy ?? 'idle'}`;
    if (signature === syncedNotificationJob.current) return;
    notificationSyncQueue.current = notificationSyncQueue.current
      .then(() => syncRestNotificationJob(state.memberId!, state.restTimer))
      .then(() => { syncedNotificationJob.current = signature; })
      .catch(() => { window.setTimeout(() => setNotificationRetry((attempt) => attempt + 1), 5000); });
  }, [notificationRetry, state.memberId, state.restTimer]);

  useEffect(() => {
    if (!state.memberId || !state.authenticated) return;
    const signature = `${state.trainingProfile.defaultReminderTime ?? ''}|${state.workouts.filter(w => w.status === 'planned').map(w => `${w.id}:${w.date}:${w.reminderTime === undefined ? 'default' : w.reminderTime === null ? 'disabled' : w.reminderTime}`).join(',')}`;
    if (signature === lastWorkoutRemindersSignature.current) return;
    notificationSyncQueue.current = notificationSyncQueue.current
      .then(() => syncWorkoutReminderJobs(state.memberId!, state.workouts, state.trainingProfile))
      .then(() => { lastWorkoutRemindersSignature.current = signature; })
      .catch(() => { window.setTimeout(() => setNotificationRetry((attempt) => attempt + 1), 5000); });
  }, [state.memberId, state.authenticated, state.workouts, state.trainingProfile.defaultReminderTime, notificationRetry]);

  useEffect(() => {
    const reconnect = () => dispatch({ type: 'set-sync', value: 'syncing' });
    const disconnect = () => dispatch({ type: 'set-sync', value: 'offline' });
    window.addEventListener('online', reconnect);
    window.addEventListener('offline', disconnect);
    return () => { window.removeEventListener('online', reconnect); window.removeEventListener('offline', disconnect); };
  }, []);

  useEffect(() => {
    if (!state.toast) return;
    const timer = window.setTimeout(() => dispatch({ type: 'clear-toast' }), 3500);
    return () => window.clearTimeout(timer);
  }, [state.toast]);

  const value = useMemo<AppContextValue>(() => ({
    ...state,
    activeWorkout: state.workouts.find((workout) => workout.status === 'active'),
    dispatch,
    requestSync: () => dispatch({ type: 'set-sync', value: syncAfterLocalEdit(state) }),
    signIn: async (email, password) => {
      if (!supabase) return supabaseConfigurationError;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? 'Sign-in failed. Check your private Member credentials.' : undefined;
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut({ scope: 'local' });
      dispatch({ type: 'session-signed-out' });
    },
    authConfigurationError: supabaseConfigurationError,
  }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}

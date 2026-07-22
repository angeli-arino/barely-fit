import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { Exercise, RaceGoal, RestTimerState, SetMeasurements, SyncState, TodayScenario, TrainingProfile, Workout, WorkoutTemplate } from '../types';
import { exercises as baseExercises, initialWorkouts, prototypeMemberId, templates as baseTemplates } from '../data/mockData';
import { supabase, supabaseConfigurationError, validateMemberSession } from '../lib/supabase';
import { clearPersistedOutbox, loadPersistedState, savePersistedState } from './persistence';
import { loadRemoteState, saveRemoteState } from './remoteState';

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
  | { type: 'start-planned-workout'; workoutId: string }
  | { type: 'add-planned-workout'; name: string; date: string; recurrence?: 'weekly' }
  | { type: 'save-template'; template: WorkoutTemplate }
  | { type: 'save-training-profile'; profile: TrainingProfile }
  | { type: 'save-race-goal'; raceGoal: RaceGoal }
  | { type: 'update-template-from-workout'; workoutId: string }
  | { type: 'add-custom-exercise'; exercise: Exercise }
  | { type: 'add-exercise-to-active'; exerciseId: string }
  | { type: 'replace-exercise-in-active'; itemId: string; exerciseId: string }
  | { type: 'remove-exercise-from-active'; itemId: string }
  | { type: 'correct-completed-set'; workoutId: string; setId: string; values: Partial<SetMeasurements> }
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
  exercises: baseExercises,
  trainingProfile: {
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
const syncAfterLocalEdit = (state: AppState): SyncState => state.syncState === 'offline' ? 'offline' : 'syncing';

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
      return { ...state, workouts: [active, ...state.workouts], syncState: syncAfterLocalEdit(state), todayScenario: 'active', toast: 'Workout started and saved locally.' };
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
        restTimer: {
          ...state.restTimer,
          active: action.restSec > 0,
          initialSec: action.restSec,
          remainingSec: action.restSec,
          paused: false,
          exerciseName: action.exerciseName,
          nextSetLabel: action.nextSetLabel,
        },
        toast: 'Set complete. Saved locally.',
      };
    }
    case 'add-set': {
      const workouts = updateActiveWorkout(state, (workout) => ({
        ...workout,
        blocks: workout.blocks.map((block) => ({
          ...block,
          exercises: block.exercises.map((item) => {
            if (item.id !== action.itemId) return item;
            const previous = item.sets[item.sets.length - 1];
            return {
              ...item,
              sets: [...item.sets, { ...previous, id: `${item.id}-set-${Date.now()}`, completed: false, completedAt: undefined }],
            };
          }),
        })),
      }));
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
      const workouts = updateActiveWorkout(state, (workout) => {
        const blocks = [...workout.blocks];
        const index = blocks.findIndex((block) => block.id === action.blockId);
        const next = index + action.direction;
        if (index < 0 || next < 0 || next >= blocks.length) return workout;
        [blocks[index], blocks[next]] = [blocks[next], blocks[index]];
        return { ...workout, blocks };
      });
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
        durationMin: workout.startedAt ? Math.max(1, Math.round((Date.now() - new Date(workout.startedAt).getTime()) / 60000)) : 1,
      }));
      return { ...state, workouts, restTimer: initialTimer, syncState: syncAfterLocalEdit(state), todayScenario: 'planned', toast: 'Workout finished. Progress recalculated.' };
    }
    case 'discard-workout':
      return { ...state, workouts: state.workouts.filter((workout) => workout.status !== 'active'), restTimer: initialTimer, syncState: syncAfterLocalEdit(state), todayScenario: 'planned', toast: 'Active workout discarded.' };
    case 'timer-tick':
      if (!state.restTimer.active || state.restTimer.paused) return state;
      if (state.restTimer.remainingSec <= 1) {
        return { ...state, restTimer: { ...state.restTimer, active: false, remainingSec: 0 }, toast: 'Rest complete. Next set is ready.' };
      }
      return { ...state, restTimer: { ...state.restTimer, remainingSec: state.restTimer.remainingSec - 1 } };
    case 'timer-adjust':
      return { ...state, restTimer: { ...state.restTimer, active: true, remainingSec: Math.max(0, state.restTimer.remainingSec + action.seconds) } };
    case 'timer-pause':
      return { ...state, restTimer: { ...state.restTimer, paused: !state.restTimer.paused } };
    case 'timer-skip':
      return { ...state, restTimer: { ...state.restTimer, active: false, remainingSec: 0 }, toast: 'Rest skipped.' };
    case 'timer-sound':
      return { ...state, restTimer: { ...state.restTimer, sound: !state.restTimer.sound } };
    case 'timer-vibration':
      return { ...state, restTimer: { ...state.restTimer, vibration: !state.restTimer.vibration } };
    case 'update-planned-workout':
      return {
        ...state,
        workouts: state.workouts.map((workout) => workout.id !== action.workoutId ? workout : ({ ...workout, status: action.status, date: action.date ?? workout.date })),
        syncState: syncAfterLocalEdit(state),
        toast: action.status === 'skipped' ? 'Workout marked skipped.' : action.date ? 'Planned Workout rescheduled.' : 'Planned Workout updated.',
      };
    case 'reschedule-planned-workout': {
      const selected = state.workouts.find((workout) => workout.id === action.workoutId);
      if (!selected) return state;
      const dayShift = Math.round((new Date(`${action.date}T12:00:00Z`).getTime() - new Date(`${selected.date}T12:00:00Z`).getTime()) / 86400000);
      const workouts = state.workouts.map((workout) => {
        const sameSeries = Boolean(selected.recurrenceSeriesId)
          && workout.recurrenceSeriesId === selected.recurrenceSeriesId
          && workout.date >= selected.date;
        if (workout.id !== selected.id && (action.scope !== 'future' || !sameSeries)) return workout;
        const shifted = new Date(`${workout.date}T12:00:00Z`);
        shifted.setUTCDate(shifted.getUTCDate() + dayShift);
        return { ...workout, date: shifted.toISOString().slice(0, 10) };
      });
      return { ...state, workouts, syncState: syncAfterLocalEdit(state), toast: action.scope === 'future' ? 'This and future Planned Workouts moved.' : 'Planned Workout moved.' };
    }
    case 'start-planned-workout': {
      if (state.workouts.some((workout) => workout.status === 'active')) return { ...state, toast: 'Resume or finish the current Active Workout first.' };
      return {
        ...state,
        workouts: state.workouts.map((workout) => workout.id === action.workoutId ? ({ ...workout, status: 'active', date: '2026-07-23', startedAt: new Date().toISOString() }) : workout),
        syncState: syncAfterLocalEdit(state),
        todayScenario: 'active',
        toast: 'Planned Workout started and saved locally.',
      };
    }
    case 'add-planned-workout': {
      const source = state.templates.find((template) => template.name === action.name) ?? state.templates[0];
      const occurrenceCount = action.recurrence === 'weekly' ? 52 : 1;
      const recurrenceSeriesId = action.recurrence === 'weekly' ? `weekly-${Date.now()}` : undefined;
      const recurrenceEnd = new Date(`${action.date}T12:00:00Z`);
      recurrenceEnd.setUTCDate(recurrenceEnd.getUTCDate() + (occurrenceCount - 1) * 7);
      const recurrenceEndDate = action.recurrence === 'weekly' ? recurrenceEnd.toISOString().slice(0, 10) : undefined;
      const plannedWorkouts: Workout[] = Array.from({ length: occurrenceCount }, (_, index) => {
        const date = new Date(`${action.date}T12:00:00Z`);
        date.setUTCDate(date.getUTCDate() + index * 7);
        return {
          id: `planned-${Date.now()}-${index}`,
          memberId: state.memberId ?? prototypeMemberId,
          templateId: source?.id,
          name: action.name,
          date: date.toISOString().slice(0, 10),
          status: 'planned',
          recurrence: action.recurrence,
          recurrenceSeriesId,
          recurrenceEndDate,
          blocks: source ? clone(source.blocks) : [],
        };
      });
      return { ...state, workouts: [...state.workouts, ...plannedWorkouts], syncState: syncAfterLocalEdit(state), toast: action.recurrence ? 'Weekly Planned Workouts added for the next year.' : 'Planned Workout added to the Workout Schedule.' };
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
      return { ...state, trainingProfile: action.profile, syncState: syncAfterLocalEdit(state), toast: 'Training Profile saved.' };
    case 'save-race-goal':
      return {
        ...state,
        raceGoals: state.raceGoals.some((raceGoal) => raceGoal.id === action.raceGoal.id)
          ? state.raceGoals.map((raceGoal) => raceGoal.id === action.raceGoal.id ? action.raceGoal : raceGoal)
          : [...state.raceGoals, action.raceGoal],
        syncState: syncAfterLocalEdit(state),
        toast: 'Race Goal saved.',
      };
    case 'update-template-from-workout': {
      const workout = state.workouts.find((candidate) => candidate.id === action.workoutId);
      if (!workout?.templateId) return { ...state, toast: 'This Workout has no source Workout Template.' };
      return {
        ...state,
        templates: state.templates.map((template) => template.id === workout.templateId ? ({
          ...template,
          name: workout.name,
          blocks: clone(workout.blocks.map((block) => ({
            ...block,
            exercises: block.exercises.map((item) => ({
              ...item,
              sets: item.sets.map((set) => ({
                ...set,
                targetLoad: set.load ?? set.targetLoad,
                targetReps: set.reps ?? set.targetReps,
                targetAssistance: set.assistance ?? set.targetAssistance,
                targetDurationSec: set.durationSec ?? set.targetDurationSec,
                targetDistanceKm: set.distanceKm ?? set.targetDistanceKm,
                load: undefined,
                reps: undefined,
                assistance: undefined,
                durationSec: undefined,
                distanceKm: undefined,
                notes: undefined,
                completed: false,
                completedAt: undefined,
              })),
            })),
          }))),
          updatedAt: new Date().toISOString().slice(0, 10),
        }) : template),
        syncState: syncAfterLocalEdit(state),
        toast: 'Workout Template updated from this completed Workout.',
      };
    }
    case 'add-custom-exercise':
      return { ...state, exercises: [...state.exercises, action.exercise], syncState: syncAfterLocalEdit(state), toast: 'Private Custom Exercise created.' };
    case 'add-exercise-to-active': {
      const exercise = state.exercises.find((candidate) => candidate.id === action.exerciseId);
      if (!exercise) return state;
      const newBlock = {
        id: `added-block-${Date.now()}`,
        type: 'single' as const,
        exercises: [{
          id: `added-item-${Date.now()}`,
          exerciseId: exercise.id,
          restSec: 90,
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
        workouts: updateActiveWorkout(state, (workout) => ({
          ...workout,
          blocks: workout.blocks.map((block) => ({
            ...block,
            exercises: block.exercises.map((item) => item.id === action.itemId ? ({ ...item, exerciseId: exercise.id, priorSummary: 'No prior performance for this replacement' }) : item),
          })),
        })),
        syncState: syncAfterLocalEdit(state),
        toast: `${exercise.name} replaced the Exercise in this Active Workout.`,
      };
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
    case 'correct-completed-set':
      return {
        ...state,
        workouts: state.workouts.map((workout) => workout.id !== action.workoutId ? workout : ({
          ...workout,
          blocks: workout.blocks.map((block) => ({
            ...block,
            exercises: block.exercises.map((item) => ({
              ...item,
              sets: item.sets.map((set) => set.id === action.setId ? ({ ...set, ...action.values }) : set),
            })),
          })),
        })),
        toast: 'Workout correction saved. Progress recalculated.',
        syncState: syncAfterLocalEdit(state),
      };
    case 'delete-workout': {
      const deletedWorkout = state.workouts.find((workout) => workout.id === action.workoutId);
      return { ...state, workouts: state.workouts.filter((workout) => workout.id !== action.workoutId), deletedWorkout, syncState: syncAfterLocalEdit(state), toast: 'Workout deleted. Undo available.' };
    }
    case 'undo-delete':
      if (!state.deletedWorkout) return state;
      return { ...state, workouts: [...state.workouts, state.deletedWorkout], deletedWorkout: undefined, syncState: syncAfterLocalEdit(state), toast: 'Workout restored. Progress recalculated.' };
    case 'clear-toast':
      return { ...state, toast: undefined };
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

  useEffect(() => {
    let cancelled = false;
    if (!supabase) {
      dispatch({ type: 'session-signed-out' });
      return () => { cancelled = true; };
    }
    const supabaseClient = supabase;

    const hydrateMember = async (memberId: string) => {
      dispatch({ type: 'set-loading', value: true });
      const local = await loadPersistedState<Partial<AppState>>(memberId).catch(() => undefined);
      let remote: Partial<AppState> | undefined;
      let remoteUnavailable = false;
      try {
        remote = await loadRemoteState<Partial<AppState>>(memberId);
      } catch {
        remoteUnavailable = true;
      }
      if (cancelled) return;
      // IndexedDB is the authoritative recovery source while offline. A remote
      // snapshot is used on a new device that has no local state yet.
      const stored = local ?? remote;
      dispatch({
        type: 'hydrate',
        payload: {
          ...seededStateForMember(memberId),
          ...stored,
          authenticated: true,
          memberId,
          syncState: remoteUnavailable ? 'offline' : remote ? (stored?.syncState ?? 'synced') : 'syncing',
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

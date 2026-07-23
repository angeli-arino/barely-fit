import type { RaceGoal, SyncState, TrainingProfile } from '../types';

export interface TrainingProfileState {
  trainingProfile: TrainingProfile;
  raceGoals: RaceGoal[];
  syncState: SyncState;
  toast?: string;
}

export type TrainingProfileAction =
  | { type: 'save-training-profile'; profile: TrainingProfile }
  | { type: 'save-race-goal'; raceGoal: RaceGoal; today: string }
  | { type: 'delete-race-goal'; raceGoalId: string };

export const syncAfterLocalEdit = ({ syncState }: { syncState: SyncState }): SyncState =>
  syncState === 'offline' ? 'offline' : 'syncing';

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function raceGoalValidationError(raceGoal: RaceGoal, today: string) {
  if (
    !raceGoal.eventName.trim()
    || !isCalendarDate(raceGoal.date)
    || raceGoal.date <= today
    || !Number.isFinite(raceGoal.distanceKm)
    || raceGoal.distanceKm <= 0
  ) {
    return 'Enter an event name, upcoming date, and distance greater than zero.';
  }
  return undefined;
}

export function applyTrainingProfileAction<T extends TrainingProfileState>(
  state: T,
  action: TrainingProfileAction,
): T {
  switch (action.type) {
    case 'save-training-profile':
      return {
        ...state,
        trainingProfile: action.profile,
        syncState: syncAfterLocalEdit(state),
        toast: 'Training Profile saved.',
      };
    case 'save-race-goal': {
      const validationError = raceGoalValidationError(action.raceGoal, action.today);
      if (validationError) {
        return {
          ...state,
          toast: validationError,
        };
      }
      const raceGoal = {
        ...action.raceGoal,
        eventName: action.raceGoal.eventName.trim(),
        targetTime: action.raceGoal.targetTime?.trim() || undefined,
      };
      return {
        ...state,
        raceGoals: state.raceGoals.some(({ id }) => id === raceGoal.id)
          ? state.raceGoals.map((current) => current.id === raceGoal.id ? raceGoal : current)
          : [...state.raceGoals, raceGoal],
        syncState: syncAfterLocalEdit(state),
        toast: 'Race Goal saved.',
      };
    }
    case 'delete-race-goal':
      if (!state.raceGoals.some(({ id }) => id === action.raceGoalId)) return state;
      return {
        ...state,
        raceGoals: state.raceGoals.filter(({ id }) => id !== action.raceGoalId),
        syncState: syncAfterLocalEdit(state),
        toast: 'Race Goal removed.',
      };
  }
}

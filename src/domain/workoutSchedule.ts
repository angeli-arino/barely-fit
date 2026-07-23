import type { Workout, WorkoutTemplate } from '../types';

export type RecurrenceEditScope = 'occurrence' | 'future';
export type PlannedWorkoutResolution = 'upcoming' | 'unresolved' | 'skipped' | 'active' | 'completed';

interface PlanWorkoutTemplateInput {
  workouts: Workout[];
  template: WorkoutTemplate;
  memberId: string;
  startDate: string;
  weekdays?: number[];
  endDate?: string;
  mutationId: string;
  today: string;
}

const parseDate = (date: string) => new Date(`${date}T12:00:00Z`);
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const shiftDate = (date: string, days: number) => {
  const shifted = parseDate(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return isoDate(shifted);
};
const isoWeekday = (date: Date) => date.getUTCDay() || 7;
const cloneBlocks = (template: WorkoutTemplate) => structuredClone(template.blocks);

export const addCalendarDays = (date: string, days: number) => shiftDate(date, days);

export const calendarWeekStart = (date: string) => {
  const daysSinceMonday = (parseDate(date).getUTCDay() + 6) % 7;
  return shiftDate(date, -daysSinceMonday);
};

function validDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return isoDate(parseDate(date)) === date;
}

export function planWorkoutTemplate({
  workouts,
  template,
  memberId,
  startDate,
  weekdays,
  endDate,
  mutationId,
  today,
}: PlanWorkoutTemplateInput): Workout[] {
  if (template.memberId !== memberId || !validDate(today) || !validDate(startDate) || startDate <= today || (endDate && (!validDate(endDate) || endDate < startDate))) return workouts;
  const recurringWeekdays = [...new Set(weekdays ?? [])].filter((day) => Number.isInteger(day) && day >= 1 && day <= 7).sort();
  const recurring = recurringWeekdays.length > 0 && Boolean(endDate);
  const dates: string[] = [];
  if (recurring) {
    for (let cursor = parseDate(startDate); isoDate(cursor) <= endDate!; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      if (recurringWeekdays.includes(isoWeekday(cursor))) dates.push(isoDate(cursor));
    }
  } else {
    dates.push(startDate);
  }
  const recurrenceSeriesId = recurring ? `recurrence-${mutationId}` : undefined;
  const existingIds = new Set(workouts.map(({ id }) => id));
  const additions = dates.flatMap((date): Workout[] => {
    const id = `planned-${mutationId}-${date}`;
    if (existingIds.has(id)) return [];
    return [{
      id,
      memberId,
      templateId: template.id,
      name: template.name,
      date,
      status: 'planned',
      blocks: cloneBlocks(template),
      recurrence: recurring ? 'weekly' : undefined,
      recurrenceSeriesId,
      recurrenceEndDate: recurring ? endDate : undefined,
    }];
  });
  return [...workouts, ...additions];
}

export function reschedulePlannedWorkout(
  workouts: Workout[],
  workoutId: string,
  date: string,
  scope: RecurrenceEditScope,
  memberId: string,
): Workout[] {
  if (!validDate(date)) return workouts;
  const selected = workouts.find((workout) => workout.id === workoutId && workout.memberId === memberId && workout.status === 'planned');
  if (!selected) return workouts;
  const dayShift = Math.round((parseDate(date).getTime() - parseDate(selected.date).getTime()) / 86_400_000);
  return workouts.map((workout) => {
    if (workout.memberId !== memberId || workout.status !== 'planned') return workout;
    if (scope === 'occurrence') {
      return workout.id === selected.id
        ? { ...workout, date, recurrence: undefined, recurrenceSeriesId: undefined, recurrenceEndDate: undefined }
        : workout;
    }
    const inAffectedSeries = workout.id === selected.id || (
      Boolean(selected.recurrenceSeriesId)
      && workout.recurrenceSeriesId === selected.recurrenceSeriesId
      && workout.date >= selected.date
    );
    if (!inAffectedSeries) return workout;
    return {
      ...workout,
      date: shiftDate(workout.date, dayShift),
      recurrenceEndDate: workout.recurrenceEndDate ? shiftDate(workout.recurrenceEndDate, dayShift) : undefined,
    };
  });
}

export function resolvePlannedWorkout(
  workouts: Workout[],
  workoutId: string,
  resolution: 'skipped',
  memberId: string,
): Workout[] {
  return workouts.map((workout) => (
    workout.id === workoutId && workout.memberId === memberId && workout.status === 'planned'
      ? { ...workout, status: resolution }
      : workout
  ));
}

export function startPlannedWorkout(
  workouts: Workout[],
  workoutId: string,
  memberId: string,
  performedDate: string,
  startedAt: string,
): Workout[] {
  if (!validDate(performedDate) || workouts.some((workout) => workout.memberId === memberId && workout.status === 'active')) return workouts;
  if (!workouts.some((workout) => workout.id === workoutId && workout.memberId === memberId && workout.status === 'planned')) return workouts;
  return workouts.map((workout) => (
    workout.id === workoutId && workout.memberId === memberId && workout.status === 'planned'
      ? { ...workout, status: 'active', plannedDate: workout.date, date: performedDate, startedAt }
      : workout
  ));
}

export function workoutSchedule(workouts: Workout[], memberId: string, today: string) {
  const canonical = new Map<string, Workout>();
  for (const workout of workouts) {
    if (workout.memberId !== memberId) continue;
    const current = canonical.get(workout.id);
    if (!current || workout.status === 'completed') canonical.set(workout.id, workout);
  }
  return [...canonical.values()]
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id))
    .map((workout) => ({
      workout,
      resolution: (
        workout.status === 'planned'
          ? workout.date < today ? 'unresolved' : 'upcoming'
          : workout.status
      ) as PlannedWorkoutResolution,
    }));
}

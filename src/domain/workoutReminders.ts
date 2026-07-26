import type { Workout } from '../types';

interface WorkoutReminderJob {
  id: string;
  deadlineAt: string;
}

interface ReconcileWorkoutRemindersInput {
  workouts: Workout[];
  defaultReminderTime?: string | null;
  existingJobs: WorkoutReminderJob[];
  now: string;
  timeZone: string;
}

interface WorkoutReminderChanges {
  cancelIds: string[];
  upsertJobs: WorkoutReminderJob[];
}

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function allowedWorkoutReminderTime(
  permission: NotificationPermission | 'unsupported',
  reminderTime: string,
  memberRemindersEnabled = false,
): string | null {
  return (permission === 'granted' || memberRemindersEnabled) && timePattern.test(reminderTime) ? reminderTime : null;
}

export function updatePlannedWorkoutReminder(
  workouts: Workout[],
  workoutId: string,
  memberId: string,
  reminderTime: string | null | undefined,
): Workout[] {
  const target = workouts.find((workout) => workout.id === workoutId && workout.memberId === memberId && workout.status === 'planned');
  if (!target) return workouts;
  return workouts.map((workout) => workout === target ? { ...workout, reminderTime } : workout);
}

function timeZoneOffsetAt(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second')) - instant.getTime();
}

function reminderDeadline(date: string, time: string, timeZone: string): string | undefined {
  const match = timePattern.exec(time);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match || !dateMatch) return undefined;
  const localAsUtc = Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]), Number(match[1]), Number(match[2]));
  let instant = new Date(localAsUtc);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    instant = new Date(localAsUtc - timeZoneOffsetAt(instant, timeZone));
  }
  return instant.toISOString();
}

export function reconcileWorkoutReminders({
  workouts,
  defaultReminderTime,
  existingJobs,
  now,
  timeZone,
}: ReconcileWorkoutRemindersInput): WorkoutReminderChanges {
  const existingById = new Map(existingJobs.map((job) => [job.id, job.deadlineAt]));
  const desiredIds = new Set<string>();
  const upsertJobs: WorkoutReminderJob[] = [];
  const nowTimestamp = new Date(now).getTime();

  for (const workout of workouts) {
    if (workout.status !== 'planned') continue;
    const reminderTime = workout.reminderTime === undefined ? defaultReminderTime : workout.reminderTime;
    if (!reminderTime) continue;
    const deadlineAt = reminderDeadline(workout.date, reminderTime, timeZone);
    if (!deadlineAt || new Date(deadlineAt).getTime() <= nowTimestamp) continue;
    desiredIds.add(workout.id);
    if (existingById.get(workout.id) !== deadlineAt) upsertJobs.push({ id: workout.id, deadlineAt });
  }

  return {
    cancelIds: existingJobs.filter((job) => !desiredIds.has(job.id)).map((job) => job.id),
    upsertJobs,
  };
}

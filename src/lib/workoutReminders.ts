import { supabase } from './supabase';
import type { Workout, TrainingProfile } from '../types';
import { reconcileWorkoutReminders } from '../domain/workoutReminders';

export async function syncWorkoutReminderJobs(
  memberId: string,
  workouts: Workout[],
  profile: TrainingProfile
): Promise<void> {
  if (!supabase) return;

  const { data: existingJobs, error: fetchError } = await supabase
    .from('workout_reminder_jobs')
    .select('id, deadline_at')
    .eq('member_id', memberId)
    .in('status', ['pending', 'processing']);

  if (fetchError) throw fetchError;
  const changes = reconcileWorkoutReminders({
    workouts,
    defaultReminderTime: profile.defaultReminderTime,
    existingJobs: (existingJobs ?? []).map((job) => ({ id: job.id, deadlineAt: job.deadline_at })),
    now: new Date().toISOString(),
    timeZone: 'Pacific/Auckland',
  });

  if (changes.cancelIds.length > 0) {
    const { error } = await supabase
      .from('workout_reminder_jobs')
      .delete()
      .eq('member_id', memberId)
      .in('id', changes.cancelIds);
    if (error) throw error;
  }

  if (changes.upsertJobs.length > 0) {
    const { error } = await supabase
      .from('workout_reminder_jobs')
      .upsert(changes.upsertJobs.map((job) => ({
        id: job.id,
        member_id: memberId,
        deadline_at: job.deadlineAt,
        status: 'pending',
        claimed_at: null,
        delivered_at: null,
      })));
    if (error) throw error;
  }
}

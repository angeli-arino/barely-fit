export function notificationForWorkoutReminder() {
  return {
    title: 'Planned Workout reminder',
    body: 'You have a Planned Workout coming up.',
    tag: 'workout-reminder',
  };
}

export function workoutReminderDeliveryResult(statusCodes: number[]) {
  const expiredIndexes = statusCodes.flatMap((statusCode, index) => (
    statusCode === 404 || statusCode === 410 ? [index] : []
  ));
  const delivered = statusCodes.some((statusCode) => statusCode >= 200 && statusCode < 300);
  const retryableFailure = statusCodes.some((statusCode) => (
    statusCode < 200 || statusCode >= 300
  ) && statusCode !== 404 && statusCode !== 410);
  return {
    expiredIndexes,
    status: delivered ? 'sent' : retryableFailure ? 'pending' : 'failed',
  } as const;
}

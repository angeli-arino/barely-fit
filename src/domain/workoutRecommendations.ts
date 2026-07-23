import type { RaceGoal, TrainingProfile } from '../types';

export interface WorkoutRecommendationContext {
  trainingProfile: TrainingProfile;
  upcomingRaceGoals: RaceGoal[];
}

export function workoutRecommendationContext(
  source: { trainingProfile: TrainingProfile; raceGoals: RaceGoal[] },
  today: string,
): WorkoutRecommendationContext {
  return {
    trainingProfile: { ...source.trainingProfile },
    upcomingRaceGoals: source.raceGoals
      .filter(({ date }) => date > today)
      .map((raceGoal) => ({ ...raceGoal }))
      .sort((left, right) => left.date.localeCompare(right.date)),
  };
}

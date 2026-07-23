export const formatSeconds = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export const formatDate = (iso: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('en-NZ', options).format(new Date(`${iso}T12:00:00+12:00`));

export const currentDateInAuckland = () => {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

export const countCompletedWorkingSets = (blocks: ExerciseBlock[]) =>
  blocks.flatMap((block) => block.exercises).flatMap((item) => item.sets).filter((set) => set.kind === 'working' && set.completed).length;

export const countTargetWorkingSets = (blocks: ExerciseBlock[]) =>
  blocks.flatMap((block) => block.exercises).flatMap((item) => item.sets).filter((set) => set.kind === 'working').length;

export const exerciseBlockLabel = (block: Pick<ExerciseBlock, 'type' | 'rounds'>) => ({
  single: 'Single exercise',
  paired: 'Paired block',
  rounds: `Rounds block · ${block.rounds ?? 3} rounds`,
})[block.type];

export const nextExerciseBlockType = (type: ExerciseBlockType): ExerciseBlockType => ({
  single: 'paired',
  paired: 'rounds',
  rounds: 'single',
} as const)[type];
import type { ExerciseBlock, ExerciseBlockType } from './types';

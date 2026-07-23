import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowDown, ArrowUp, Ellipsis, Plus, Repeat2, TimerReset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ExerciseBlock, ExerciseItem, PerformedSet } from '../../types';
import { exerciseBlockLabel } from '../../lib';
import { useAppState } from '../../state/AppState';
import { SetRow } from './SetRow';
import { Button } from '../ui/Button';
import { nextRelevantSetLabel } from '../../domain/restTimer';

type BlockSet = { item: ExerciseItem; itemIndex: number; set: PerformedSet; setIndex: number; round: number };

function orderedRounds(block: ExerciseBlock): BlockSet[][] {
  const count = Math.max(block.rounds ?? 0, ...block.exercises.map((item) => item.sets.length));
  return Array.from({ length: count }, (_, roundIndex) => block.exercises.flatMap((item, itemIndex) => {
    const set = item.sets[roundIndex];
    return set ? [{ item, itemIndex, set, setIndex: roundIndex, round: roundIndex + 1 }] : [];
  }));
}

function ExerciseOptions({ block, item, itemIndex }: { block: ExerciseBlock; item: ExerciseItem; itemIndex: number }) {
  const { dispatch } = useAppState();
  const navigate = useNavigate();
  return <DropdownMenu.Root>
    <DropdownMenu.Trigger className="grid size-11 shrink-0 place-items-center rounded-[12px] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]" aria-label="Exercise options"><Ellipsis size={21} /></DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content sideOffset={6} align="end" className="z-50 min-w-52 rounded-[14px] border border-[var(--border-strong)] bg-[var(--surface-strong)] p-1.5 text-sm shadow-[var(--shadow-2)]">
      <DropdownMenu.Item onSelect={() => dispatch({ type: 'notify', message: 'Target editing is available inline before set completion.' })} className="flex min-h-11 cursor-pointer items-center rounded-[10px] px-3 outline-none hover:bg-[var(--surface-hover)]">Edit targets</DropdownMenu.Item>
      <DropdownMenu.Item onSelect={() => navigate(`/exercises?replace=${item.id}`)} className="flex min-h-11 cursor-pointer items-center rounded-[10px] px-3 outline-none hover:bg-[var(--surface-hover)]">Replace Exercise</DropdownMenu.Item>
      <DropdownMenu.Item onSelect={() => navigate(`/exercises?block=${block.id}`)} className="flex min-h-11 cursor-pointer items-center rounded-[10px] px-3 outline-none hover:bg-[var(--surface-hover)]">Add Exercise to block</DropdownMenu.Item>
      <DropdownMenu.Item disabled={itemIndex === 0} onSelect={() => dispatch({ type: 'move-exercise', itemId: item.id, direction: -1 })} className="flex min-h-11 cursor-pointer items-center rounded-[10px] px-3 outline-none hover:bg-[var(--surface-hover)] disabled:opacity-40">Move Exercise earlier</DropdownMenu.Item>
      <DropdownMenu.Item disabled={itemIndex === block.exercises.length - 1} onSelect={() => dispatch({ type: 'move-exercise', itemId: item.id, direction: 1 })} className="flex min-h-11 cursor-pointer items-center rounded-[10px] px-3 outline-none hover:bg-[var(--surface-hover)] disabled:opacity-40">Move Exercise later</DropdownMenu.Item>
      <DropdownMenu.Item onSelect={() => dispatch({ type: 'set-block-type', blockId: block.id, blockType: 'paired' })} className="flex min-h-11 cursor-pointer items-center rounded-[10px] px-3 outline-none hover:bg-[var(--surface-hover)]">Make paired Exercise Block</DropdownMenu.Item>
      <DropdownMenu.Item onSelect={() => dispatch({ type: 'set-block-type', blockId: block.id, blockType: 'rounds' })} className="flex min-h-11 cursor-pointer items-center rounded-[10px] px-3 outline-none hover:bg-[var(--surface-hover)]">Make rounds Exercise Block</DropdownMenu.Item>
      {block.type !== 'single' && <DropdownMenu.Item onSelect={() => dispatch({ type: 'set-block-type', blockId: block.id, blockType: 'single' })} className="flex min-h-11 cursor-pointer items-center rounded-[10px] px-3 outline-none hover:bg-[var(--surface-hover)]">Make single Exercise Block</DropdownMenu.Item>}
      <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
      <DropdownMenu.Item onSelect={() => dispatch({ type: 'remove-exercise-from-active', itemId: item.id })} className="flex min-h-11 cursor-pointer items-center rounded-[10px] px-3 text-[var(--danger)] outline-none hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]">Remove exercise</DropdownMenu.Item>
    </DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root>;
}

function ExerciseSetCard({ block, item, itemIndex, entries }: { block: ExerciseBlock; item: ExerciseItem; itemIndex: number; entries: Array<{ set: PerformedSet; setIndex: number; label?: string; nextSetLabel?: string }> }) {
  const { exercises, activeWorkout, dispatch } = useAppState();
  const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
  if (!exercise) return null;
  const completed = item.sets.filter((set) => set.completed).length;
  return <article className="p-4 sm:p-5">
    <div className="mb-4 flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold tracking-[-.02em]">{exercise.name}</h2><span className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">{completed}/{item.sets.length} sets</span></div><p className="mt-1 text-sm text-[var(--text-muted)]">{item.priorSummary}</p><div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-faint)]"><TimerReset size={14} /> Default rest {Math.floor(item.restSec / 60)}:{String(item.restSec % 60).padStart(2, '0')}</div></div><ExerciseOptions block={block} item={item} itemIndex={itemIndex} /></div>
    <div className="space-y-2.5">{entries.map((entry) => <SetRow key={entry.set.id} set={entry.set} item={item} exercise={exercise} index={entry.setIndex} label={entry.label} nextSetLabel={entry.nextSetLabel ?? (activeWorkout ? nextRelevantSetLabel(activeWorkout.blocks, entry.set.id, exercises) : undefined)} />)}</div>
    <Button className="mt-3" variant="ghost" full icon={<Plus size={17} />} onClick={() => dispatch({ type: 'add-set', itemId: item.id })}>Add set</Button>
  </article>;
}

export function ExerciseBlockCard({ block, blockIndex, totalBlocks }: { block: ExerciseBlock; blockIndex: number; totalBlocks: number }) {
  const { dispatch } = useAppState();
  const typeLabel = block.type === 'single' ? null : exerciseBlockLabel(block);
  const rounds = block.type === 'single' ? [] : orderedRounds(block);

  return <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-1)]">
    {typeLabel && <div className="flex min-h-10 items-center gap-2 border-b border-[var(--border)] bg-[var(--accent-soft)] px-4 text-xs font-black uppercase tracking-[.13em] text-[var(--accent)]"><Repeat2 size={15} />{typeLabel}{block.title && <span className="font-medium normal-case tracking-normal text-[var(--text-muted)]">· {block.title}</span>}</div>}
    <div className="divide-y divide-[var(--border)]">{block.type === 'single'
      ? block.exercises.map((item, itemIndex) => <ExerciseSetCard key={item.id} block={block} item={item} itemIndex={itemIndex} entries={item.sets.map((set, setIndex) => ({ set, setIndex }))} />)
      : rounds.map((round, roundIndex) => <div key={`round-${roundIndex}`}><div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-black uppercase tracking-[.12em] text-[var(--accent)]">Round {roundIndex + 1} of {rounds.length}</div>{round.map((entry) => {
        return <ExerciseSetCard key={entry.set.id} block={block} item={entry.item} itemIndex={entry.itemIndex} entries={[{ set: entry.set, setIndex: entry.setIndex, label: `Round ${entry.round} · ${entry.set.kind === 'warmup' ? 'Warm-up' : 'Working Set'}` }]} />;
      })}</div>)}</div>
    <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-2"><span className="text-xs font-semibold text-[var(--text-faint)]">Block {blockIndex + 1} of {totalBlocks}</span><div className="flex gap-1"><button className="grid size-10 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-strong)] disabled:opacity-30" disabled={blockIndex === 0} onClick={() => dispatch({ type: 'move-block', blockId: block.id, direction: -1 })} aria-label="Move exercise block up"><ArrowUp size={17} /></button><button className="grid size-10 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-strong)] disabled:opacity-30" disabled={blockIndex === totalBlocks - 1} onClick={() => dispatch({ type: 'move-block', blockId: block.id, direction: 1 })} aria-label="Move exercise block down"><ArrowDown size={17} /></button></div></div>
  </section>;
}

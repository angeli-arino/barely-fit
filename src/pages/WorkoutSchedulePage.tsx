import { AlertCircle, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Copy, MoreHorizontal, Plus, Repeat2, SkipForward } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import type { Workout } from '../types';
import { Surface } from '../components/ui/Surface';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { currentDateInAuckland, formatDate } from '../lib';
import { addCalendarDays, calendarWeekStart, workoutSchedule } from '../domain/workoutSchedule';

const weekdayOptions = [
  { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

const statusStyle: Record<Workout['status'], string> = {
  planned: 'border-[var(--border)] bg-[var(--surface)]',
  active: 'border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--accent-soft)]',
  completed: 'border-[color-mix(in_srgb,var(--success)_25%,var(--border))] bg-[color-mix(in_srgb,var(--success)_7%,var(--surface))]',
  skipped: 'border-[var(--border)] bg-[var(--surface)] opacity-65',
};

export function WorkoutSchedulePage() {
  const { workouts, templates, memberId, dispatch } = useAppState();
  const navigate = useNavigate();
  const today = useMemo(currentDateInAuckland, []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(() => calendarWeekStart(today));
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(today);
  const [createTemplateId, setCreateTemplateId] = useState(() => templates[0]?.id ?? '');
  const [createDate, setCreateDate] = useState(today);
  const [createRecurring, setCreateRecurring] = useState(false);
  const [createWeekdays, setCreateWeekdays] = useState<number[]>([]);
  const [createEndDate, setCreateEndDate] = useState(() => addCalendarDays(today, 84));
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const iso = addCalendarDays(weekStart, index);
    const date = new Date(`${iso}T12:00:00Z`);
    return {
      iso,
      day: new Intl.DateTimeFormat('en-NZ', { weekday: 'short', timeZone: 'UTC' }).format(date),
      date: String(date.getUTCDate()),
    };
  }), [weekStart]);
  const weekEnd = weekDates.at(-1)!.iso;

  const scheduleEntries = useMemo(() => workoutSchedule(workouts, memberId ?? '', today), [memberId, today, workouts]);
  const schedule = useMemo(() => scheduleEntries.map(({ workout }) => workout), [scheduleEntries]);
  const selectedItems = schedule.filter((workout) => workout.date === selectedDate);
  const unresolved = scheduleEntries.find(({ resolution }) => resolution === 'unresolved')?.workout;

  const openWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setRescheduleDate(workout.date);
  };

  const applyReschedule = () => {
    if (!selectedWorkout) return;
    if (selectedWorkout.recurrence) {
      setScopeOpen(true);
      return;
    }
    dispatch({ type: 'reschedule-planned-workout', workoutId: selectedWorkout.id, date: rescheduleDate, scope: 'occurrence' });
    setSelectedWorkout(null);
  };
  const startLate = (workoutId: string) => {
    dispatch({ type: 'start-planned-workout', workoutId, performedDate: today });
    navigate('/workout/active');
  };
  const openCreate = (date: string) => {
    const futureDate = date > today ? date : addCalendarDays(today, 1);
    setCreateDate(futureDate);
    setCreateWeekdays([new Date(`${futureDate}T12:00:00Z`).getUTCDay() || 7]);
    setCreateEndDate(addCalendarDays(futureDate, 84));
    setCreateOpen(true);
  };
  const toggleCreateWeekday = (weekday: number) => {
    setCreateWeekdays((current) => current.includes(weekday) ? current.filter((item) => item !== weekday) : [...current, weekday].sort());
  };
  const moveWeek = (direction: -1 | 1) => {
    const nextStart = addCalendarDays(weekStart, direction * 7);
    setWeekStart(nextStart);
    setSelectedDate(nextStart);
  };

  return (
    <div className="space-y-6 animate-rise">
      <header className="flex items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-[var(--text-muted)]">{formatDate(weekStart, { day: 'numeric', month: 'short' })}–{formatDate(weekEnd, { day: 'numeric', month: 'short', year: 'numeric' })}</p><h1 className="mt-1 text-3xl font-black tracking-[-.045em] sm:text-4xl">Workout Schedule</h1></div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => openCreate(selectedDate)}>Plan workout</Button>
      </header>

      <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2">
        <button className="grid size-11 place-items-center rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]" aria-label="Previous week" onClick={() => moveWeek(-1)}><ChevronLeft size={20} /></button>
        <div className="text-center"><div className="text-sm font-bold">Selected week</div><div className="text-xs text-[var(--text-faint)]">Strength + running Workout Schedule</div></div>
        <button className="grid size-11 place-items-center rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]" aria-label="Next week" onClick={() => moveWeek(1)}><ChevronRight size={20} /></button>
      </div>

      {unresolved && (
        <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))] p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3"><AlertCircle className="mt-0.5 shrink-0 text-[var(--warning)]" size={20} /><div><div className="font-bold">Tuesday’s Planned Workout is unresolved</div><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{unresolved.name} remains visible until you complete it late, move it, or mark it skipped.</p></div></div>
          <div className="grid grid-cols-3 gap-2 sm:flex"><Button size="sm" onClick={() => startLate(unresolved.id)} icon={<Check size={15} />}>Complete late</Button><Button size="sm" onClick={() => openWorkout(unresolved)}>Move</Button><Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'update-planned-workout', workoutId: unresolved.id, status: 'skipped' })}>Skip</Button></div>
        </div>
      )}

      <section className="lg:hidden">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-3" aria-label="Select day">
          {weekDates.map((day) => {
            const count = schedule.filter((workout) => workout.date === day.iso).length;
            const active = selectedDate === day.iso;
            return <button key={day.iso} className={`min-h-[76px] min-w-[66px] rounded-[16px] border px-2 text-center transition ${active ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`} onClick={() => setSelectedDate(day.iso)}><div className="text-xs font-bold">{day.day}</div><div className="metric mt-1 text-xl font-black">{day.date}</div><div className={`mx-auto mt-1 h-1.5 w-1.5 rounded-full ${count ? 'bg-current' : 'bg-transparent'}`} /></button>;
          })}
        </div>
        <div className="mt-2"><h2 className="text-lg font-bold">{formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })}</h2><div className="mt-3 space-y-3">{selectedItems.length ? selectedItems.map((workout) => <WorkoutScheduleCard key={workout.id} workout={workout} onOpen={openWorkout} today={today} />) : <EmptyDay onCreate={() => openCreate(selectedDate)} />}</div></div>
      </section>

      <section className="hidden lg:block">
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((day) => <div key={day.iso} className="min-w-0"><div className={`mb-2 rounded-[12px] px-2 py-3 text-center ${day.iso === today ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}><div className="text-xs font-bold uppercase tracking-[.1em]">{day.day}</div><div className="metric mt-1 text-xl font-black">{day.date}</div></div><div className="space-y-2">{schedule.filter((workout) => workout.date === day.iso).map((workout) => <WorkoutScheduleCard key={workout.id} workout={workout} onOpen={openWorkout} compact today={today} />)}<button className="grid min-h-16 w-full place-items-center rounded-[14px] border border-dashed border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--border-strong)] hover:text-[var(--text-muted)]" onClick={() => { setSelectedDate(day.iso); openCreate(day.iso); }} aria-label={`Add workout on ${day.day}`}><Plus size={18} /></button></div></div>)}
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <Link to="/templates" className="flex min-h-20 items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] transition hover:bg-[var(--surface-strong)]"><div className="grid size-11 place-items-center rounded-[13px] bg-[var(--surface-strong)] text-[var(--text-muted)]"><Copy size={20} /></div><div className="min-w-0 flex-1"><div className="font-bold">Workout templates</div><div className="text-sm text-[var(--text-muted)]">Build and reuse exercise blocks</div></div><ChevronRight className="text-[var(--text-faint)]" size={19} /></Link>
        <Surface className="flex min-h-20 items-center gap-4 p-4"><div className="grid size-11 place-items-center rounded-[13px] bg-[var(--surface-strong)] text-[var(--text-muted)]"><CalendarDays size={20} /></div><div><div className="font-bold">Weekly recurrence</div><div className="text-sm text-[var(--text-muted)]">Friday Heavy Legs and Sunday Long Run repeat weekly</div></div></Surface>
      </div>

      <Sheet open={Boolean(selectedWorkout)} onOpenChange={(open) => !open && setSelectedWorkout(null)} title={selectedWorkout?.name ?? 'Workout'} description={selectedWorkout?.recurrence ? `This Workout repeats weekly${selectedWorkout.recurrenceEndDate ? ` through ${formatDate(selectedWorkout.recurrenceEndDate, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}.` : 'Edit this planned occurrence.'}>
        {selectedWorkout && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] bg-[var(--surface)] p-4"><div><div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">Date</div><div className="mt-1 font-bold">{formatDate(selectedWorkout.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div></div><div><div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">State</div><div className="mt-1 capitalize font-bold">{selectedWorkout.status}</div></div></div>
          {selectedWorkout.status === 'planned' && <>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[var(--text-muted)]">Move to</span><input type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text)]" /></label>
            <Button full variant="primary" onClick={applyReschedule}>Reschedule</Button>
            <Button full onClick={() => startLate(selectedWorkout.id)} icon={<Check size={17} />}>{selectedWorkout.date < today ? 'Complete late' : 'Start Workout'}</Button>
            <Button full variant="ghost" onClick={() => { dispatch({ type: 'update-planned-workout', workoutId: selectedWorkout.id, status: 'skipped' }); setSelectedWorkout(null); }} icon={<SkipForward size={17} />}>Mark skipped</Button>
          </>}
          {selectedWorkout.status === 'active' && <Button full variant="primary" onClick={() => navigate('/workout/active')}>Resume Active Workout</Button>}
          {selectedWorkout.status === 'completed' && <Button full onClick={() => navigate(`/history/${selectedWorkout.id}`)}>View Workout History</Button>}
        </div>}
      </Sheet>

      <Sheet open={scopeOpen} onOpenChange={setScopeOpen} title="Apply recurrence change" description="Choose how far this schedule edit should reach.">
        <div className="space-y-2">
          <button className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left hover:bg-[var(--surface-strong)]" onClick={() => { if (selectedWorkout) dispatch({ type: 'reschedule-planned-workout', workoutId: selectedWorkout.id, date: rescheduleDate, scope: 'occurrence' }); setScopeOpen(false); setSelectedWorkout(null); }}><div className="font-bold">This occurrence only</div><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Move this Workout. Future occurrences stay unchanged.</p></button>
          <button className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left hover:bg-[var(--surface-strong)]" onClick={() => { if (selectedWorkout) dispatch({ type: 'reschedule-planned-workout', workoutId: selectedWorkout.id, date: rescheduleDate, scope: 'future' }); setScopeOpen(false); setSelectedWorkout(null); }}><div className="flex items-center gap-2 font-bold"><Repeat2 size={17} /> This and future</div><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Move this occurrence and update the recurring weekday from here forward.</p></button>
        </div>
      </Sheet>

      <Sheet open={createOpen} onOpenChange={setCreateOpen} title="Plan a workout" description="Create one occurrence or make it recur weekly.">
        <div className="space-y-4">
          <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[var(--text-muted)]">Workout Template</span><select value={createTemplateId} onChange={(event) => setCreateTemplateId(event.target.value)} className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3">{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
          <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[var(--text-muted)]">Date</span><input type="date" min={addCalendarDays(today, 1)} value={createDate} onChange={(event) => setCreateDate(event.target.value)} className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3" /></label>
          <label className="flex min-h-12 items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3"><span className="flex items-center gap-2 font-semibold"><Repeat2 size={17} /> Repeat weekly</span><input type="checkbox" checked={createRecurring} onChange={(event) => setCreateRecurring(event.target.checked)} className="size-5 accent-[var(--accent)]" /></label>
          {createRecurring && <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3">
            <fieldset><legend className="text-xs font-bold uppercase tracking-[.1em] text-[var(--text-muted)]">Repeat on</legend><div className="mt-2 grid grid-cols-7 gap-1">{weekdayOptions.map((weekday) => <button type="button" key={weekday.value} aria-pressed={createWeekdays.includes(weekday.value)} onClick={() => toggleCreateWeekday(weekday.value)} className={`min-h-11 rounded-[10px] text-xs font-bold ${createWeekdays.includes(weekday.value) ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-strong)] text-[var(--text-muted)]'}`}>{weekday.label}</button>)}</div></fieldset>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[var(--text-muted)]">End date</span><input type="date" min={createDate} value={createEndDate} onChange={(event) => setCreateEndDate(event.target.value)} className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3" /></label>
          </div>}
          <Button variant="primary" full disabled={!createTemplateId || createDate <= today || (createRecurring && (!createWeekdays.length || createEndDate < createDate))} onClick={() => { dispatch({ type: 'add-planned-workout', templateId: createTemplateId, date: createDate, weekdays: createRecurring ? createWeekdays : undefined, endDate: createRecurring ? createEndDate : undefined, mutationId: crypto.randomUUID(), today }); setCreateOpen(false); }}>Add to Workout Schedule</Button>
        </div>
      </Sheet>
    </div>
  );
}

function WorkoutScheduleCard({ workout, onOpen, compact = false, today }: { workout: Workout; onOpen: (workout: Workout) => void; compact?: boolean; today: string }) {
  const unresolved = workout.status === 'planned' && workout.date < today;
  return (
    <button className={`w-full rounded-[var(--radius-md)] border text-left transition hover:border-[var(--border-strong)] ${statusStyle[workout.status]} ${compact ? 'p-3' : 'p-4'}`} onClick={() => onOpen(workout)}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-[11px] ${workout.status === 'completed' ? 'bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]' : unresolved ? 'bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]' : 'bg-[var(--surface-strong)] text-[var(--text-muted)]'}`}>{workout.status === 'completed' ? <Check size={17} /> : unresolved ? <AlertCircle size={17} /> : workout.recurrence ? <Repeat2 size={17} /> : <Clock3 size={17} />}</div>
        <div className="min-w-0 flex-1"><div className={`${compact ? 'text-sm' : 'text-base'} font-bold leading-tight`}>{workout.name}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{workout.status === 'completed' ? `${workout.durationMin ?? 58} min · completed` : workout.status === 'skipped' ? 'Skipped' : unresolved ? 'Needs resolution' : workout.recurrence ? `Repeats weekly${workout.recurrenceEndDate ? ` through ${formatDate(workout.recurrenceEndDate, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}` : 'Planned'}</div></div>
        <MoreHorizontal size={17} className="shrink-0 text-[var(--text-faint)]" />
      </div>
    </button>
  );
}

function EmptyDay({ onCreate }: { onCreate: () => void }) {
  return <button className="grid min-h-32 w-full place-items-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 text-center hover:border-[var(--border-strong)]" onClick={onCreate}><div><Plus className="mx-auto text-[var(--text-faint)]" size={22} /><div className="mt-2 font-bold">Nothing planned</div><div className="mt-1 text-sm text-[var(--text-muted)]">Add a workout or keep the day clear.</div></div></button>;
}

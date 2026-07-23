import { ArrowLeft, Check, ChevronRight, Dumbbell, Filter, ImageOff, Info, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { FormField } from '../components/ui/FormField';
import { useAppState } from '../state/AppState';
import type { Exercise, MeasurementType } from '../types';

const muscles = ['All', 'Quads', 'Glutes', 'Hamstrings', 'Lats', 'Chest', 'Core', 'Cardio'];
const equipment = ['All equipment', 'Barbell', 'Dumbbells', 'Machine', 'Cable machine', 'Resistance band', 'Mat'];

export function ExerciseCatalogPage() {
  const { exercises, activeWorkout, dispatch, memberId } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const replacementItemId = searchParams.get('replace');
  const targetBlockId = searchParams.get('block');
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState('All equipment');
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [customMuscles, setCustomMuscles] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [customRestSec, setCustomRestSec] = useState('90');
  const [measurementType, setMeasurementType] = useState<MeasurementType>('reps-load');
  const [error, setError] = useState('');

  const filtered = useMemo(() => exercises.filter((exercise) => (exercise.catalog || exercise.custom) && (() => {
    const textMatch = `${exercise.name} ${exercise.primaryMuscles.join(' ')} ${exercise.secondaryMuscles.join(' ')} ${exercise.equipment.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    const muscleMatch = muscle === 'All' || exercise.primaryMuscles.includes(muscle) || exercise.secondaryMuscles.includes(muscle);
    const equipmentMatch = equipmentFilter === 'All equipment' || exercise.equipment.some((item) => item.toLowerCase().includes(equipmentFilter.toLowerCase().replace('machine', '').trim()));
    return textMatch && muscleMatch && equipmentMatch;
  })()), [equipmentFilter, exercises, muscle, query]);

  const createCustom = () => {
    if (!customName.trim()) {
      setError('Give the custom exercise a name.');
      return;
    }
    dispatch({ type: 'create-custom-exercise', input: { name: customName, measurementType, primaryMuscles: customMuscles.split(',').map((value) => value.trim()).filter(Boolean), equipment: customEquipment.split(',').map((value) => value.trim()).filter(Boolean), instructions: customInstructions.split('\n').map((value) => value.trim()).filter(Boolean), defaultRestSec: Number(customRestSec) || undefined } });
    setCustomOpen(false);
    setCustomName('');
    setCustomEquipment('');
    setCustomMuscles('');
    setCustomInstructions('');
    setError('');
  };

  const addSelected = () => {
    if (!selected) return;
    if (activeWorkout) {
      dispatch(replacementItemId
        ? { type: 'replace-exercise-in-active', itemId: replacementItemId, exerciseId: selected.id }
        : targetBlockId
          ? { type: 'add-exercise-to-active-block', blockId: targetBlockId, exerciseId: selected.id }
          : { type: 'add-exercise-to-active', exerciseId: selected.id });
      setSelected(null);
      navigate('/workout/active');
    }
  };

  return (
    <div className="space-y-5 animate-rise">
      <header className="flex items-start gap-3"><Link to={activeWorkout ? '/workout/active' : '/templates'} className="grid size-11 shrink-0 place-items-center rounded-[12px] text-[var(--text-muted)] hover:bg-[var(--surface)]" aria-label="Back"><ArrowLeft size={21} /></Link><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--text-muted)]">Curated local catalog</p><h1 className="mt-1 text-3xl font-black tracking-[-.045em] sm:text-4xl">Exercises</h1></div><Button variant="primary" icon={<Plus size={18} />} onClick={() => setCustomOpen(true)}><span className="hidden sm:inline">Custom exercise</span><span className="sm:hidden">Custom</span></Button></header>

      <div className="sticky top-[74px] z-10 space-y-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] p-3 backdrop-blur-xl lg:top-3">
        <div className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3"><Search size={18} className="text-[var(--text-faint)]" /><input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--text-faint)]" placeholder="Search exercise, muscle, equipment" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search exercises" /></div>
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {muscles.map((item) => <button key={item} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold ${muscle === item ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`} onClick={() => setMuscle(item)}>{item}</button>)}
        </div>
        <label className="flex min-h-11 items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text-muted)]"><Filter size={16} /><select className="min-w-0 flex-1 bg-transparent text-[var(--text)] outline-none" value={equipmentFilter} onChange={(event) => setEquipmentFilter(event.target.value)}>{equipment.map((item) => <option key={item}>{item}</option>)}</select><SlidersHorizontal size={16} /></label>
      </div>

      <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[var(--text-muted)]">{filtered.length} exercises</p>{activeWorkout && <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--accent)]">Adding to {activeWorkout.name}</span>}</div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((exercise) => (
          <button key={exercise.id} className="flex min-h-24 items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 text-left shadow-[var(--shadow-1)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]" onClick={() => setSelected(exercise)}>
            {exercise.illustration
              ? <img className="size-16 shrink-0 rounded-[14px] object-cover" src={exercise.illustration.url} alt="" />
              : <div className="grid size-16 shrink-0 place-items-center rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-faint)]"><ImageOff size={21} /><span className="sr-only">Neutral illustration placeholder</span></div>}
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{exercise.name}</h2>{exercise.custom && <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-black uppercase tracking-[.1em] text-[var(--accent)]">Private</span>}</div><p className="mt-1 text-sm text-[var(--text-muted)]">{exercise.primaryMuscles.join(' · ')}</p><p className="mt-1 truncate text-xs text-[var(--text-faint)]">{exercise.equipment.join(', ')}</p></div><ChevronRight size={18} className="shrink-0 text-[var(--text-faint)]" />
          </button>
        ))}
      </div>

      {filtered.length === 0 && <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center"><Search className="mx-auto text-[var(--text-faint)]" /><h2 className="mt-4 font-bold">No matching exercises</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Clear a filter or create a private custom exercise.</p><Button className="mt-4" onClick={() => { setQuery(''); setMuscle('All'); setEquipmentFilter('All equipment'); }}>Clear filters</Button></div>}

      <aside className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-muted)]"><div className="flex items-center gap-2 font-bold text-[var(--text)]"><Info size={17} /> Exercise Catalog provenance</div><p className="mt-2">Every Exercise includes its source, author, exact license, and pinned snapshot metadata. Exercises and illustrations without reviewed, compatible rights are excluded before this offline catalog is generated.</p></aside>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} title={selected?.name ?? 'Exercise'} description={selected ? `${selected.primaryMuscles.join(' · ')} · ${selected.equipment.join(', ')}` : undefined}>
        {selected && <div>
          {selected.illustration
            ? <img className="aspect-[16/8] w-full rounded-[var(--radius-lg)] object-cover" src={selected.illustration.url} alt="" />
            : <div className="grid aspect-[16/8] place-items-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] text-center text-[var(--text-faint)]"><div><ImageOff className="mx-auto" size={26} /><p className="mt-2 text-sm font-semibold">{selected.placeholderLabel}</p><p className="mt-1 text-xs">No approved illustration included</p></div></div>}
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-[var(--radius-md)] bg-[var(--surface)] p-3"><div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">Measures</div><div className="mt-1 font-bold capitalize">{selected.measurementType.replaceAll('-', ' + ')}</div></div><div className="rounded-[var(--radius-md)] bg-[var(--surface)] p-3"><div className="text-xs font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">Secondary</div><div className="mt-1 font-bold">{selected.secondaryMuscles.join(', ') || 'None'}</div></div></div>
          <h3 className="mt-5 font-bold">Instructions</h3><ol className="mt-2 space-y-2 text-sm leading-6 text-[var(--text-muted)]">{selected.instructions.map((instruction, index) => <li key={instruction} className="flex gap-3"><span className="metric font-bold text-[var(--text-faint)]">{index + 1}</span><span>{instruction}</span></li>)}</ol>
          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"><div className="font-bold">Attribution</div><dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[var(--text-muted)]"><dt>Source</dt><dd>{selected.provenance.sourceUrl ? <a className="underline" href={selected.provenance.sourceUrl} target="_blank" rel="noreferrer">{selected.provenance.source}</a> : selected.provenance.source}</dd><dt>Author</dt><dd>{selected.provenance.author}</dd><dt>License</dt><dd>{selected.provenance.licenseUrl ? <a className="underline" href={selected.provenance.licenseUrl} target="_blank" rel="noreferrer">{selected.provenance.license}</a> : selected.provenance.license}</dd><dt>Snapshot</dt><dd>{selected.provenance.snapshotDate}</dd><dt>Review</dt><dd className="capitalize">{selected.provenance.reviewStatus}</dd></dl></div>
          {selected.custom && <div className="mt-5 grid grid-cols-2 gap-3"><Button onClick={() => { const name = window.prompt('Custom Exercise name', selected.name); if (name) dispatch({ type: 'edit-custom-exercise', exerciseId: selected.id, input: { name, measurementType: selected.measurementType, primaryMuscles: selected.primaryMuscles, secondaryMuscles: selected.secondaryMuscles, equipment: selected.equipment, instructions: selected.instructions, defaultRestSec: selected.defaultRestSec } }); }}>Edit</Button><Button variant="danger" onClick={() => { dispatch({ type: 'delete-custom-exercise', exerciseId: selected.id }); setSelected(null); }}>Delete</Button></div>}
          {activeWorkout ? <Button className="mt-6" variant="primary" size="lg" full icon={<Plus size={18} />} onClick={addSelected}>{replacementItemId ? 'Replace Exercise' : targetBlockId ? 'Add to Exercise Block' : 'Add to Active Workout'}</Button> : <Button className="mt-6" variant="primary" size="lg" full icon={<Check size={18} />} onClick={() => setSelected(null)}>Inspect Exercise</Button>}
        </div>}
      </Sheet>

      <Sheet open={customOpen} onOpenChange={setCustomOpen} title="Create Custom Exercise" description="This Exercise is private to the Member and can use the measurement model that matches it.">
        <div className="space-y-4">
          <FormField label="Exercise name" placeholder="e.g. Single-leg abduction machine" value={customName} onChange={(event) => { setCustomName(event.target.value); setError(''); }} error={error} />
          <FormField label="Equipment" placeholder="Machine, band, dumbbell…" value={customEquipment} onChange={(event) => setCustomEquipment(event.target.value)} />
          <FormField label="Primary muscles" placeholder="e.g. Glutes, Core" value={customMuscles} onChange={(event) => setCustomMuscles(event.target.value)} />
          <FormField label="Instructions" placeholder="One instruction per line" value={customInstructions} onChange={(event) => setCustomInstructions(event.target.value)} />
          <FormField label="Default Rest Timer (seconds)" type="number" value={customRestSec} onChange={(event) => setCustomRestSec(event.target.value)} />
          <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[var(--text-muted)]">Measurement type</span><select className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3" value={measurementType} onChange={(event) => setMeasurementType(event.target.value as MeasurementType)}><option value="reps-load">Load + repetitions</option><option value="reps-assistance">Assistance + repetitions</option><option value="duration">Duration</option><option value="distance-duration">Distance + duration</option><option value="reps">Repetitions only</option></select></label>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-muted)]"><Dumbbell className="mb-2 text-[var(--text-faint)]" size={19} />For dumbbells and loaded carries, load is entered per implement or side. For barbells, load includes the bar.</div>
          <Button variant="primary" size="lg" full onClick={createCustom}>Create exercise</Button>
        </div>
      </Sheet>
    </div>
  );
}

import { ChevronRight, Copy, Dumbbell, Plus, Repeat2, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Surface } from '../components/ui/Surface';
import { Button } from '../components/ui/Button';
import { useAppState } from '../state/AppState';

export function TemplatesPage() {
  const { dispatch, templates } = useAppState();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const createTemplate = () => {
    const id = `template-${Date.now()}`;
    dispatch({ type: 'save-template', template: { ...structuredClone(templates[0]), id, name: 'Untitled Workout Template', blocks: [], updatedAt: new Date().toISOString().slice(0, 10) } });
    navigate(`/templates/${id}`);
  };
  const duplicateTemplate = (templateId: string) => {
    const source = templates.find((template) => template.id === templateId);
    if (!source) return;
    const id = `${source.id}-copy-${Date.now()}`;
    dispatch({ type: 'save-template', template: { ...structuredClone(source), id, name: `${source.name} copy`, updatedAt: new Date().toISOString().slice(0, 10) } });
  };
  const visibleTemplates = templates.filter((template) => `${template.name} ${template.focus}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="space-y-6 animate-rise">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-[var(--text-muted)]">Reusable starting points</p><h1 className="mt-1 text-3xl font-black tracking-[-.045em] sm:text-4xl">Workout Templates</h1></div><Button variant="primary" icon={<Plus size={18} />} onClick={createTemplate}>New Workout Template</Button></header>
      <div className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3"><Search size={18} className="text-[var(--text-faint)]" /><input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--text-faint)]" placeholder="Search templates" aria-label="Search templates" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        {visibleTemplates.map((template) => {
          const blocks = template.blocks.length;
          const exercises = template.blocks.reduce((sum, block) => sum + block.exercises.length, 0);
          const hasMultiExerciseBlock = template.blocks.some((block) => block.type !== 'single');
          return (
            <Surface key={template.id} className="overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-[var(--accent-soft)] text-[var(--accent)]"><Dumbbell size={22} /></div><div className="min-w-0 flex-1"><h2 className="text-xl font-black tracking-[-.025em]">{template.name}</h2><p className="mt-1 text-sm text-[var(--text-muted)]">{template.focus}</p></div>{hasMultiExerciseBlock && <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]"><Repeat2 size={12} /> multi-exercise</span>}</div>
                <div className="mt-5 grid grid-cols-3 gap-2 rounded-[var(--radius-md)] bg-[var(--surface-strong)] p-3 text-center"><div><div className="metric text-xl font-black">{template.estimatedMin}</div><div className="text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">minutes</div></div><div><div className="metric text-xl font-black">{exercises}</div><div className="text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">exercises</div></div><div><div className="metric text-xl font-black">{blocks}</div><div className="text-[10px] font-bold uppercase tracking-[.1em] text-[var(--text-faint)]">blocks</div></div></div>
              </div>
              <div className="grid grid-cols-[1fr_auto] border-t border-[var(--border)]"><Link to={`/templates/${template.id}`} className="flex min-h-14 items-center justify-between px-5 text-sm font-bold hover:bg-[var(--surface-strong)]">Edit Workout Template <ChevronRight size={17} className="text-[var(--text-faint)]" /></Link><button onClick={() => duplicateTemplate(template.id)} className="grid w-14 place-items-center border-l border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]" aria-label={`Duplicate ${template.name}`}><Copy size={18} /></button></div>
              <div className="border-t border-[var(--border)] p-3"><Button full variant="primary" onClick={() => { dispatch({ type: 'start-template', templateId: template.id }); navigate('/workout/active'); }}>Start workout</Button></div>
            </Surface>
          );
        })}
      </div>
      {!visibleTemplates.length && <Surface className="p-8 text-center"><div className="font-bold">No matching templates</div><p className="mt-2 text-sm text-[var(--text-muted)]">Try a workout name or focus area.</p></Surface>}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="font-bold">Workout edits do not silently rewrite templates</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">An Active Workout can change freely. Only an explicit Update Template action after finishing applies those changes to its Workout Template.</p></div>
    </div>
  );
}

import * as Switch from '@radix-ui/react-switch';
import { Bell, Check, ChevronRight, Cloud, CloudOff, Download, HardDrive, Info, LockKeyhole, Moon, RefreshCw, Ruler, ShieldCheck, Smartphone, Sun, Target, TriangleAlert, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Surface } from '../components/ui/Surface';
import { useAppState } from '../state/AppState';
import type { SyncState, TodayScenario } from '../types';

export function SettingsPage() {
  const { syncState, todayScenario, trainingProfile, raceGoals, dispatch } = useAppState();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [timerNotifications, setTimerNotifications] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileDraft, setProfileDraft] = useState(trainingProfile);
  const [raceGoalDraft, setRaceGoalDraft] = useState(raceGoals[0]);

  const setAppTheme = (next: 'dark' | 'light') => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
  };
  const saveProfile = () => {
    dispatch({ type: 'save-training-profile', profile: profileDraft });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };
  const simulateLoading = () => {
    dispatch({ type: 'set-loading', value: true });
    window.setTimeout(() => dispatch({ type: 'set-loading', value: false }), 900);
  };

  return (
    <div className="space-y-7 animate-rise">
      <header><p className="text-sm font-semibold text-[var(--text-muted)]">Profile, device and prototype controls</p><h1 className="mt-1 text-3xl font-black tracking-[-.045em] sm:text-4xl">Settings</h1></header>

      <Section title="Training profile" icon={<UserRound size={19} />} description="Defaults used when planning and creating workouts.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary goals"><select value={profileDraft.primaryGoals} onChange={(event) => setProfileDraft((current) => ({ ...current, primaryGoals: event.target.value }))} className="input"><option>Strength + half marathon</option><option>Build strength</option><option>Run performance</option><option>General fitness</option></select></Field>
          <Field label="Available equipment"><input className="input" value={profileDraft.availableEquipment} onChange={(event) => setProfileDraft((current) => ({ ...current, availableEquipment: event.target.value }))} /></Field>
          <Field label="Preferred workout length"><select value={profileDraft.preferredWorkoutLengthMin} onChange={(event) => setProfileDraft((current) => ({ ...current, preferredWorkoutLengthMin: Number(event.target.value) }))} className="input"><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="75">75 minutes</option></select></Field>
          <Field label="Weekly frequency"><select value={profileDraft.weeklyFrequency} onChange={(event) => setProfileDraft((current) => ({ ...current, weeklyFrequency: Number(event.target.value) }))} className="input"><option value="4">4 Workouts</option><option value="5">5 Workouts</option><option value="6">6 Workouts</option></select></Field>
          <Field label="Preferred Exercises"><input className="input" value={profileDraft.preferredExercises} onChange={(event) => setProfileDraft((current) => ({ ...current, preferredExercises: event.target.value }))} /></Field>
          <Field label="Avoided Exercises"><input className="input" value={profileDraft.avoidedExercises} onChange={(event) => setProfileDraft((current) => ({ ...current, avoidedExercises: event.target.value }))} /></Field>
          <Field label="Physical limitations" full><textarea className="input min-h-24 resize-y py-3" value={profileDraft.physicalLimitations} onChange={(event) => setProfileDraft((current) => ({ ...current, physicalLimitations: event.target.value }))} /></Field>
        </div>
        <Button className="mt-4" variant="primary" onClick={saveProfile} icon={saved ? <Check size={17} /> : undefined}>{saved ? 'Profile saved' : 'Save profile'}</Button>
      </Section>

      <Section title="Race goals" icon={<Target size={19} />} description="Running goals remain part of the private training profile.">
        {raceGoalDraft && <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:grid-cols-2"><Field label="Event name"><input className="input" value={raceGoalDraft.eventName} onChange={(event) => setRaceGoalDraft((current) => current && ({ ...current, eventName: event.target.value }))} /></Field><Field label="Date"><input type="date" className="input" value={raceGoalDraft.date} onChange={(event) => setRaceGoalDraft((current) => current && ({ ...current, date: event.target.value }))} /></Field><Field label="Distance km"><input type="number" step="0.1" className="input" value={raceGoalDraft.distanceKm} onChange={(event) => setRaceGoalDraft((current) => current && ({ ...current, distanceKm: Number(event.target.value) }))} /></Field><Field label="Target time"><input className="input" value={raceGoalDraft.targetTime ?? ''} onChange={(event) => setRaceGoalDraft((current) => current && ({ ...current, targetTime: event.target.value || undefined }))} /></Field><Button variant="primary" onClick={() => dispatch({ type: 'save-race-goal', raceGoal: raceGoalDraft })}>Save Race Goal</Button></div>}
        <Button className="mt-3" variant="ghost" onClick={() => setRaceGoalDraft({ id: `race-goal-${Date.now()}`, eventName: '', date: '2026-11-01', distanceKm: 5 })}>+ Add Race Goal</Button>
      </Section>

      <Section title="Units and appearance" icon={<Ruler size={19} />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-h-14 items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-4"><span className="font-semibold">Load</span><span className="rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-sm font-bold">kg</span></div>
          <div className="flex min-h-14 items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-4"><span className="font-semibold">Distance</span><span className="rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-sm font-bold">km</span></div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-1"><button className={`flex min-h-12 items-center justify-center gap-2 rounded-[11px] font-bold ${theme === 'dark' ? 'bg-[var(--surface-strong)] text-[var(--text)]' : 'text-[var(--text-muted)]'}`} onClick={() => setAppTheme('dark')}><Moon size={17} /> Dark</button><button className={`flex min-h-12 items-center justify-center gap-2 rounded-[11px] font-bold ${theme === 'light' ? 'bg-[var(--surface-strong)] text-[var(--text)]' : 'text-[var(--text-muted)]'}`} onClick={() => setAppTheme('light')}><Sun size={17} /> Light preview</button></div>
      </Section>

      <Section title="Notifications" icon={<Bell size={19} />} description="Permission and delivery state for time-sensitive training cues.">
        <SettingToggle label="Rest timer alerts" description="Sound and vibration when rest reaches zero." checked={timerNotifications} onCheckedChange={setTimerNotifications} status="Allowed" />
        <SettingToggle label="Workout reminders" description="Optional reminder before a planned workout." checked={workoutReminders} onCheckedChange={setWorkoutReminders} status={workoutReminders ? 'Allowed' : 'Off'} />
        <p className="mt-3 text-xs leading-5 text-[var(--text-faint)]">Prototype toggles only. No push server or browser permission request is implemented.</p>
      </Section>

      <Section title="Install on iPhone" icon={<Download size={19} />} description="Shown when the app is not detected as installed.">
        <ol className="space-y-3 text-sm leading-6 text-[var(--text-muted)]"><li className="flex gap-3"><span className="metric font-bold text-[var(--text-faint)]">1</span><span>Open the app in Chrome on iPhone.</span></li><li className="flex gap-3"><span className="metric font-bold text-[var(--text-faint)]">2</span><span>Use Share, then choose Add to Home Screen.</span></li><li className="flex gap-3"><span className="metric font-bold text-[var(--text-faint)]">3</span><span>Launch Barely Fit from the Home Screen for safe-area and standalone behaviour.</span></li></ol>
        <div className="mt-4 flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] p-3 text-sm"><Info size={17} className="mt-0.5 shrink-0 text-[var(--text-faint)]" /><span className="text-[var(--text-muted)]">The prototype includes a manifest and iOS meta tags, but deliberately excludes a service worker.</span></div>
      </Section>

      <Section title="Storage and sign-in" icon={<HardDrive size={19} />}>
        <div className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)]"><StatusRow icon={<ShieldCheck size={18} />} label="Member" value="Private beta · signed in" /><StatusRow icon={<Smartphone size={18} />} label="Device sign-in" value="Remains signed in" /><StatusRow icon={<HardDrive size={18} />} label="Offline storage" value="14.2 MB · healthy" /><StatusRow icon={syncIcon(syncState)} label="Last sync" value={syncCopy(syncState)} /></div>
        <div className="mt-3 grid grid-cols-2 gap-2"><Button onClick={() => dispatch({ type: 'set-sync', value: 'syncing' })} icon={<RefreshCw size={17} />}>Retry sync</Button><Link to="/sign-in" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-strong)] px-4 text-sm font-semibold hover:bg-[var(--surface-hover)]"><LockKeyhole size={17} /> Sign-in screen</Link></div>
      </Section>

      <Section title="Prototype states" icon={<TriangleAlert size={19} />} description="Switch realistic states for design review and handoff inspection.">
        <div className="mb-4"><div className="mb-2 text-xs font-black uppercase tracking-[.1em] text-[var(--text-faint)]">Today scenario</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(['active', 'planned', 'rest', 'empty'] as TodayScenario[]).map((scenario) => <button key={scenario} className={`min-h-11 rounded-[12px] border px-3 text-sm font-bold capitalize ${todayScenario === scenario ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`} onClick={() => dispatch({ type: 'set-scenario', value: scenario })}>{scenario}</button>)}</div></div>
        <div><div className="mb-2 text-xs font-black uppercase tracking-[.1em] text-[var(--text-faint)]">Sync state</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{(['online', 'offline', 'syncing', 'synced', 'error'] as SyncState[]).map((state) => <button key={state} className={`min-h-11 rounded-[12px] border px-3 text-sm font-bold capitalize ${syncState === state ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`} onClick={() => dispatch({ type: 'set-sync', value: state })}>{state}</button>)}</div></div>
        <Button className="mt-4" variant="ghost" onClick={simulateLoading}>Preview loading recovery</Button>
      </Section>

      <button onClick={() => { dispatch({ type: 'sign-out' }); navigate('/sign-in'); }} className="flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 text-left text-[var(--danger)]"><LockKeyhole size={18} /><span className="flex-1 font-bold">Sign out of this device</span><ChevronRight size={18} /></button>
    </div>
  );
}

function Section({ title, icon, description, children }: { title: string; icon: React.ReactNode; description?: string; children: React.ReactNode }) {
  return <section><div className="mb-3 flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[var(--surface)] text-[var(--text-muted)]">{icon}</div><div><h2 className="text-xl font-bold">{title}</h2>{description && <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{description}</p>}</div></div><Surface className="p-4 sm:p-5">{children}</Surface></section>;
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <label className={full ? 'sm:col-span-2' : ''}><span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[var(--text-muted)]">{label}</span>{children}</label>;
}

function SettingToggle({ label, description, checked, onCheckedChange, status }: { label: string; description: string; checked: boolean; onCheckedChange: (checked: boolean) => void; status: string }) {
  return <div className="flex min-h-20 items-center gap-4 border-b border-[var(--border)] py-3 last:border-b-0"><div className="min-w-0 flex-1"><div className="font-bold">{label}</div><div className="mt-1 text-sm text-[var(--text-muted)]">{description}</div></div><div className="text-right"><div className="mb-2 text-xs font-bold text-[var(--text-faint)]">{status}</div><Switch.Root checked={checked} onCheckedChange={onCheckedChange} className="relative h-7 w-12 rounded-full bg-[var(--border-strong)] data-[state=checked]:bg-[var(--accent)]" aria-label={label}><Switch.Thumb className="block size-5 translate-x-1 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-6" /></Switch.Root></div></div>;
}

function StatusRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex min-h-14 items-center gap-3 px-3"><span className="text-[var(--text-faint)]">{icon}</span><span className="flex-1 text-sm font-semibold">{label}</span><span className="text-right text-sm text-[var(--text-muted)]">{value}</span></div>;
}

function syncIcon(state: SyncState) {
  if (state === 'offline') return <CloudOff size={18} />;
  if (state === 'error') return <TriangleAlert size={18} />;
  if (state === 'syncing') return <RefreshCw size={18} className="animate-spin" />;
  return <Cloud size={18} />;
}

function syncCopy(state: SyncState) {
  if (state === 'offline') return 'Offline · local safe';
  if (state === 'error') return 'Retry available';
  if (state === 'syncing') return 'Syncing now';
  return 'A moment ago';
}

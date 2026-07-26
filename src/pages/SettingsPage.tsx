import * as Switch from '@radix-ui/react-switch';
import { Bell, Check, ChevronRight, Cloud, CloudOff, Download, HardDrive, Info, LockKeyhole, Moon, Pencil, RefreshCw, Ruler, ShieldCheck, Smartphone, Sun, Target, Trash2, TriangleAlert, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Surface } from '../components/ui/Surface';
import { useAppState } from '../state/AppState';
import { raceGoalValidationError } from '../state/trainingProfileState';
import type { RaceGoal, SyncState, TodayScenario } from '../types';
import { canEnableBackgroundNotifications, enableBackgroundNotifications } from '../lib/restNotifications';
import { currentDateInAuckland } from '../lib';
import { allowedWorkoutReminderTime } from '../domain/workoutReminders';

export function SettingsPage() {
  const { syncState, todayScenario, trainingProfile, raceGoals, workouts, restTimer, memberId, dispatch, signOut } = useAppState();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [timerNotifications, setTimerNotifications] = useState(restTimer.sound || restTimer.vibration);
  const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => notificationsSupported ? Notification.permission : 'unsupported');
  const [saved, setSaved] = useState(false);
  const [profileDraft, setProfileDraft] = useState(trainingProfile);
  const [raceGoalDraft, setRaceGoalDraft] = useState<RaceGoal>();
  const today = currentDateInAuckland();
  const raceGoalDraftIsValid = Boolean(raceGoalDraft && !raceGoalValidationError(raceGoalDraft, today));
  const memberHasWorkoutReminders = trainingProfile.defaultReminderTime != null
    || workouts.some((workout) => workout.status === 'planned' && typeof workout.reminderTime === 'string');

  const setAppTheme = (next: 'dark' | 'light') => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
  };
  const saveProfile = () => {
    dispatch({ type: 'save-training-profile', profile: profileDraft });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };
  const saveRaceGoal = () => {
    if (!raceGoalDraft || !raceGoalDraftIsValid) return;
    dispatch({ type: 'save-race-goal', raceGoal: raceGoalDraft, today });
    setRaceGoalDraft(undefined);
  };
  const simulateLoading = () => {
    dispatch({ type: 'set-loading', value: true });
    window.setTimeout(() => dispatch({ type: 'set-loading', value: false }), 900);
  };
  const requestBackgroundNotifications = async () => {
    if (!memberId || !notificationsSupported || !window.matchMedia('(display-mode: standalone)').matches) return;
    const permission = await enableBackgroundNotifications(memberId);
    setNotificationPermission(permission);
    return permission;
  };
  const setWorkoutReminders = async (checked: boolean) => {
    let permission = notificationPermission;
    if (checked && !memberHasWorkoutReminders && notificationPermission !== 'granted') {
      permission = await requestBackgroundNotifications() ?? notificationPermission;
    }
    const profile = {
      ...trainingProfile,
      defaultReminderTime: checked
        ? allowedWorkoutReminderTime(permission, trainingProfile.defaultReminderTime ?? '08:00', memberHasWorkoutReminders)
        : null,
    };
    dispatch({ type: 'save-training-profile', profile });
    setProfileDraft(profile);
  };

  return (
    <div className="space-y-7 animate-rise">
      <header><p className="text-sm font-semibold text-[var(--text-muted)]">Profile, device and prototype controls</p><h1 className="mt-1 text-3xl font-black tracking-[-.045em] sm:text-4xl">Settings</h1></header>

      <Section title="Training profile" icon={<UserRound size={19} />} description="Defaults used when planning and creating workouts.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary goals"><input className="input" value={profileDraft.primaryGoals} onChange={(event) => setProfileDraft((current) => ({ ...current, primaryGoals: event.target.value }))} /></Field>
          <Field label="Available equipment"><input className="input" value={profileDraft.availableEquipment} onChange={(event) => setProfileDraft((current) => ({ ...current, availableEquipment: event.target.value }))} /></Field>
          <Field label="Preferred workout length"><select value={profileDraft.preferredWorkoutLengthMin} onChange={(event) => setProfileDraft((current) => ({ ...current, preferredWorkoutLengthMin: Number(event.target.value) }))} className="input"><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="75">75 minutes</option></select></Field>
          <Field label="Weekly frequency"><select value={profileDraft.weeklyFrequency} onChange={(event) => setProfileDraft((current) => ({ ...current, weeklyFrequency: Number(event.target.value) }))} className="input"><option value="4">4 Workouts</option><option value="5">5 Workouts</option><option value="6">6 Workouts</option></select></Field>
          <Field label="Preferred Exercises"><input className="input" value={profileDraft.preferredExercises} onChange={(event) => setProfileDraft((current) => ({ ...current, preferredExercises: event.target.value }))} /></Field>
          <Field label="Avoided Exercises"><input className="input" value={profileDraft.avoidedExercises} onChange={(event) => setProfileDraft((current) => ({ ...current, avoidedExercises: event.target.value }))} /></Field>
          <Field label="Physical limitations (optional)" full><textarea className="input min-h-24 resize-y py-3" value={profileDraft.physicalLimitations ?? ''} onChange={(event) => setProfileDraft((current) => ({ ...current, physicalLimitations: event.target.value || undefined }))} /><span className="mt-2 block text-sm leading-6 text-[var(--text-muted)]">Private to your Member data. Record practical training context only; Barely Fit does not provide or infer a medical diagnosis.</span></Field>
        </div>
        <Button className="mt-4" variant="primary" onClick={saveProfile} icon={saved ? <Check size={17} /> : undefined}>{saved ? 'Profile saved' : 'Save profile'}</Button>
      </Section>

      <Section title="Race goals" icon={<Target size={19} />} description="Running goals remain part of the private training profile.">
        <div className="space-y-3">
          {raceGoals.length === 0 && <p className="rounded-[var(--radius-md)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-muted)]">No upcoming Race Goals yet.</p>}
          {raceGoals.map((raceGoal) => (
            <div key={raceGoal.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
              <div className="min-w-0 flex-1">
                <div className="font-bold">{raceGoal.eventName}</div>
                <div className="mt-1 text-sm text-[var(--text-muted)]">{raceGoal.date} · {raceGoal.distanceKm} km{raceGoal.targetTime ? ` · ${raceGoal.targetTime}` : ''}</div>
              </div>
              <Button size="sm" variant="ghost" icon={<Pencil size={16} />} onClick={() => setRaceGoalDraft(raceGoal)}>Edit</Button>
              <Button size="sm" variant="danger" icon={<Trash2 size={16} />} onClick={() => { dispatch({ type: 'delete-race-goal', raceGoalId: raceGoal.id }); if (raceGoalDraft?.id === raceGoal.id) setRaceGoalDraft(undefined); }}>Remove</Button>
            </div>
          ))}
        </div>
        {raceGoalDraft && (
          <div className="mt-4 grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:grid-cols-2">
            <Field label="Event name"><input className="input" value={raceGoalDraft.eventName} onChange={(event) => setRaceGoalDraft((current) => current && ({ ...current, eventName: event.target.value }))} /></Field>
            <Field label="Date"><input type="date" min={today} className="input" value={raceGoalDraft.date} onChange={(event) => setRaceGoalDraft((current) => current && ({ ...current, date: event.target.value }))} /></Field>
            <Field label="Distance km"><input type="number" min="0.1" step="0.1" className="input" value={raceGoalDraft.distanceKm || ''} onChange={(event) => setRaceGoalDraft((current) => current && ({ ...current, distanceKm: Number(event.target.value) }))} /></Field>
            <Field label="Target time (optional)"><input className="input" placeholder="HH:MM:SS" value={raceGoalDraft.targetTime ?? ''} onChange={(event) => setRaceGoalDraft((current) => current && ({ ...current, targetTime: event.target.value || undefined }))} /></Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button variant="primary" onClick={saveRaceGoal} disabled={!raceGoalDraftIsValid}>Save Race Goal</Button>
              <Button variant="ghost" onClick={() => setRaceGoalDraft(undefined)}>Cancel</Button>
            </div>
          </div>
        )}
        {!raceGoalDraft && <Button className="mt-3" variant="ghost" onClick={() => setRaceGoalDraft({ id: crypto.randomUUID(), eventName: '', date: '', distanceKm: 0 })}>+ Add Race Goal</Button>}
      </Section>

      <Section title="Units and appearance" icon={<Ruler size={19} />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Load display"><select className="input" value={profileDraft.loadUnit ?? 'kg'} onChange={(event) => setProfileDraft((current) => ({ ...current, loadUnit: event.target.value as 'kg' | 'lb' }))}><option value="kg">kg</option><option value="lb">lb</option></select></Field>
          <Field label="Distance display"><select className="input" value={profileDraft.distanceUnit ?? 'km'} onChange={(event) => setProfileDraft((current) => ({ ...current, distanceUnit: event.target.value as 'km' | 'mi' }))}><option value="km">km</option><option value="mi">mi</option></select></Field>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-1"><button className={`flex min-h-12 items-center justify-center gap-2 rounded-[11px] font-bold ${theme === 'dark' ? 'bg-[var(--surface-strong)] text-[var(--text)]' : 'text-[var(--text-muted)]'}`} onClick={() => setAppTheme('dark')}><Moon size={17} /> Dark</button><button className={`flex min-h-12 items-center justify-center gap-2 rounded-[11px] font-bold ${theme === 'light' ? 'bg-[var(--surface-strong)] text-[var(--text)]' : 'text-[var(--text-muted)]'}`} onClick={() => setAppTheme('light')}><Sun size={17} /> Light preview</button></div>
      </Section>

      <Section title="Notifications" icon={<Bell size={19} />} description="Permission and delivery state for time-sensitive training cues.">
        <SettingToggle label="Foreground rest alerts" description="Sound and vibration when rest reaches zero while Barely Fit is open." checked={timerNotifications} onCheckedChange={(checked) => { setTimerNotifications(checked); if (restTimer.sound !== checked) dispatch({ type: 'timer-sound' }); if (restTimer.vibration !== checked) dispatch({ type: 'timer-vibration' }); }} status={timerNotifications ? 'On' : 'Off'} />
        <SettingToggle
          label="Workout reminders"
          description="Notify me for upcoming Planned Workouts. Customize individual workouts in the Plan."
          checked={trainingProfile.defaultReminderTime != null}
          onCheckedChange={(checked) => void setWorkoutReminders(checked)}
          status={trainingProfile.defaultReminderTime ? `At ${trainingProfile.defaultReminderTime}` : 'Off'}
        />
        {trainingProfile.defaultReminderTime && (
          <div className="flex items-center gap-3 border-b border-[var(--border)] py-3 last:border-b-0">
            <div className="min-w-0 flex-1 pl-10 text-sm font-bold text-[var(--text-muted)]">Default time of day</div>
            <input
              type="time"
              className="input w-32"
              value={trainingProfile.defaultReminderTime}
              onChange={(event) => {
                const profile = { ...trainingProfile, defaultReminderTime: event.target.value };
                dispatch({ type: 'save-training-profile', profile });
                setProfileDraft(profile);
              }}
            />
          </div>
        )}
        <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] p-3 text-sm leading-6 text-[var(--text-muted)]"><strong className="text-[var(--text)]">Background alerts require the installed PWA.</strong> Add Barely Fit to your Home Screen, then allow notifications. We only use permission to deliver training cues and reminders.</div>
        {notificationPermission === 'unsupported' || !canEnableBackgroundNotifications() ? <p className="mt-3 text-sm text-[var(--text-muted)]">Background alerts are unavailable until this deployment is configured for Web Push.</p> : notificationPermission === 'granted' ? <p className="mt-3 text-sm font-semibold text-[var(--success)]">Notifications are allowed on this device.</p> : <Button className="mt-3" onClick={() => void requestBackgroundNotifications()} disabled={!window.matchMedia('(display-mode: standalone)').matches}>Enable background alerts</Button>}
      </Section>

      <Section title="Install on iPhone" icon={<Download size={19} />} description="Shown when the app is not detected as installed.">
        <ol className="space-y-3 text-sm leading-6 text-[var(--text-muted)]"><li className="flex gap-3"><span className="metric font-bold text-[var(--text-faint)]">1</span><span>Open the app in Chrome on iPhone.</span></li><li className="flex gap-3"><span className="metric font-bold text-[var(--text-faint)]">2</span><span>Use Share, then choose Add to Home Screen.</span></li><li className="flex gap-3"><span className="metric font-bold text-[var(--text-faint)]">3</span><span>Launch Barely Fit from the Home Screen for safe-area and standalone behaviour.</span></li></ol>
        <div className="mt-4 flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] p-3 text-sm"><Info size={17} className="mt-0.5 shrink-0 text-[var(--text-faint)]" /><span className="text-[var(--text-muted)]">The installed PWA registers a service worker for rest-complete notifications. You can continue logging while a Rest Timer runs.</span></div>
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

      <button onClick={() => { void signOut().then(() => navigate('/sign-in')); }} className="flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 text-left text-[var(--danger)]"><LockKeyhole size={18} /><span className="flex-1 font-bold">Sign out of this device</span><ChevronRight size={18} /></button>
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

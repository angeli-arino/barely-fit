import { BarChart3, CalendarDays, Dumbbell, History, Settings } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAppState } from '../../state/AppState';
import { SyncStatus } from './SyncStatus';
import { RestTimerCompact } from '../workout/RestTimer';

const nav = [
  { to: '/today', label: 'Today', icon: Dumbbell },
  { to: '/plan', label: 'Schedule', icon: CalendarDays },
  { to: '/history', label: 'History', icon: History },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  const { syncState, restTimer } = useAppState();
  const location = useLocation();
  const isActiveWorkout = location.pathname === '/workout/active';

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] border-r border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-6 lg:flex lg:flex-col">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="grid size-10 place-items-center rounded-[12px] bg-[var(--accent)] text-sm font-black tracking-[-.08em] text-[#151515]">F</div>
          <div><div className="font-black tracking-[.08em]">BARELY FIT</div><div className="text-xs text-[var(--text-faint)]">private workout tracking</div></div>
        </div>
        <nav className="space-y-1" aria-label="Primary navigation">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => clsx('flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold transition', isActive ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]')}>
              <Icon size={19} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-[var(--text-faint)]">Local-first</div>
          <SyncStatus state={syncState} />
          <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">Every workout edit is stored on this device before sync.</p>
        </div>
      </aside>

      <div className="lg:pl-[232px]">
        {!isActiveWorkout && (
          <header className="safe-top sticky top-0 z-20 border-b border-[color-mix(in_srgb,var(--border)_78%,transparent)] bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] px-4 pb-3 backdrop-blur-xl lg:px-8">
            <div className="mx-auto flex max-w-[1180px] items-center justify-between">
              <div className="lg:hidden"><span className="font-black tracking-[.08em]">BARELY FIT</span></div>
              <div className="hidden text-sm text-[var(--text-muted)] lg:block">Thursday, 23 July</div>
              <SyncStatus state={syncState} />
            </div>
          </header>
        )}

        <main className={clsx('mx-auto w-full max-w-[1180px] px-4 lg:px-8', isActiveWorkout ? 'pb-36' : 'pb-28 pt-5 lg:pb-12 lg:pt-8')}>
          <Outlet />
        </main>
      </div>

      {restTimer.active && <RestTimerCompact />}

      {!isActiveWorkout && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-elevated)_94%,transparent)] px-2 pt-2 backdrop-blur-xl lg:hidden" aria-label="Primary navigation">
          <div className="grid grid-cols-5">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => clsx('flex min-h-14 flex-col items-center justify-center gap-1 rounded-[12px] text-[11px] font-semibold transition', isActive ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]')}>
                <Icon size={21} strokeWidth={2.1} />{label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

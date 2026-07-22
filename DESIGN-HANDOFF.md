# Barely Fit — design handoff

The supplied `FORM` working name has been replaced with the repository's established product name, Barely Fit. The simple text mark remains intentionally provisional rather than a finished brand system.

## 1. Product intent

This prototype is a solo, private beta designed to replace Fitbod for one Member. The dominant use case is logging a real Workout on an iPhone 16 Pro installed to the Home Screen, with a secondary desktop use case for planning and reviewing history and charts.

The design optimizes for:

- one-handed use, sweat, gym lighting, and interruptions;
- immediate local persistence and calm offline behaviour;
- explicit set completion rather than accidental counting;
- fast comparison of prior performance against today's target;
- progressive disclosure for editing, reordering, replacement, and advanced fields;
- dense information only where it directly accelerates logging.

## 2. Visual principles and rationale

### Instrument, not dashboard

The interface should feel like a precise training instrument. It avoids generic analytics-dashboard grids, social fitness motifs, game UI, and decorative cards that do not support a task.

### Dark-first, high-contrast, restrained accent

Near-black neutral surfaces reduce glare in gym lighting. A single warm signal accent identifies the current action, active state, and primary progress line. Success, warning, danger, and informational colors remain semantic and secondary.

### Hierarchy through type and surface, not effects

Large, disciplined headings; compact uppercase metadata; tabular figures; subtle elevation; and strong boundaries create hierarchy. There are no giant gradients, glass-heavy panels, or ornamental background effects.

### Action clarity

The main logging action is always a large `Complete set` button. Editable values are grouped immediately above it. Secondary controls are placed in menus, sheets, or block footers.

### Local-first reassurance

Offline and sync states are visible but not alarming. Copy consistently confirms that recording remains safe and available.

## 3. Design tokens

All production-facing visual values should continue to resolve through CSS variables in `src/styles.css`.

### Color

| Token | Dark value | Purpose |
|---|---:|---|
| `--bg` | `#0b0d10` | App canvas |
| `--bg-elevated` | `#111419` | Elevated page regions, sheets |
| `--surface` | `#15191f` | Primary task surface |
| `--surface-strong` | `#1b2027` | Selected / nested surface |
| `--surface-hover` | `#222831` | Hover and pressed affordance |
| `--text` | `#f6f7f8` | Primary text |
| `--text-muted` | `#9da5af` | Supporting text |
| `--text-faint` | `#6f7884` | Low-priority metadata |
| `--border` | `#2a3039` | Default boundary |
| `--border-strong` | `#3a424d` | Hover, focus-adjacent boundary |
| `--accent` | `#ff6b4a` | Primary action and active state |
| `--accent-hover` | `#ff8064` | Primary hover |
| `--accent-soft` | translucent accent | Selected background |
| `--success` | `#66d19e` | Completed / safe state |
| `--warning` | `#f2bb62` | Unresolved / attention state |
| `--danger` | `#ff6f75` | Destructive action |
| `--info` | `#7eb4ff` | Informational state |

A coherent light-mode token override is included under `[data-theme='light']`. Components must not use dark-specific raw colors except for the intentionally dark text on the accent button.

### Typography

- Primary stack: `Inter`, system UI, Apple system, Segoe UI.
- Metrics: system monospace stack through `.metric`.
- Page title: 30–36 px mobile/desktop, 900 weight, tight tracking.
- Section title: 20 px, 700.
- Body: 14–16 px, 1.5–1.75 line height.
- Metadata: 10–12 px, 700–900, uppercase, 0.08–0.13 em tracking.
- Numeric fields use tabular numerals.

No hosted font dependency is required for the prototype.

### Spacing

Base spacing follows a 4 px rhythm:

`4, 8, 12, 16, 20, 24, 32, 40` through `--space-*` tokens.

Touch controls are at least 44 px high. Primary workout actions are 56 px.

### Radius

| Token | Value | Use |
|---|---:|---|
| `--radius-sm` | 10 px | Compact controls |
| `--radius-md` | 14 px | Inputs, buttons, set rows |
| `--radius-lg` | 20 px | Cards, exercise blocks |
| `--radius-xl` | 28 px | Sheets, sign-in panel |

### Shadow

- `--shadow-1`: quiet surface lift.
- `--shadow-2`: modal, sheet, persistent timer elevation.

Shadows support layering and must not substitute for a visible boundary.

### Motion

- `--motion-fast`: 140 ms for direct control feedback.
- `--motion-base`: 220 ms for sheets and entry transitions.
- Scale-on-press is limited to `0.985` on buttons.
- `prefers-reduced-motion` removes meaningful animation duration.

## 4. Component inventory and variants

### Foundation

- `Button`
  - variants: `primary`, `secondary`, `ghost`, `danger`;
  - sizes: `sm`, `md`, `lg`;
  - supports icon and full width.
- `Surface`
  - neutral bordered/elevated container;
  - should contain a task or coherent content group.
- `FormField`
  - label, input, optional suffix, validation error.
- `Sheet`
  - mobile bottom sheet;
  - centered desktop dialog;
  - focus management and dismissal supplied by Radix Dialog.
- `Toast`
  - transient success/error feedback;
  - optional Undo action for deletion.

### Navigation and status

- `AppShell`
  - mobile bottom navigation;
  - desktop fixed rail;
  - safe-area-aware mobile header and footer.
- `SyncStatus`
  - `online`, `offline`, `syncing`, `synced`, `error`;
  - compact icon-only-label variant in Active Workout.
- `LoadingScreen`
  - local recovery/loading skeleton.

### Workout logging

- `ExerciseBlockCard`
  - single-Exercise, paired, and rounds-based Exercise Block header variants;
  - prior performance, rest default, set progress;
  - reorder controls and advanced overflow menu.
- `SetRow`
  - pending, completed, warm-up, working variants;
  - measurement layouts for load/reps, assistance/reps, reps only, duration, distance/duration;
  - optional RIR and notes through progressive disclosure;
  - explicit `Complete set` action.
- `RestTimerCompact`
  - persistent, non-blocking timer;
  - progress line, current exercise, next-set preview.
- `RestTimerSheet`
  - ±15 seconds, pause/resume, skip, sound, vibration.

### Planning

- `WorkoutScheduleCard`
  - planned, active, completed, skipped, unresolved states;
  - compact desktop-week variant.
- mobile day picker
  - horizontally scrollable 7-day selector;
  - selected day renders an accessible agenda list rather than a compressed calendar.
- recurrence scope sheet
  - this occurrence;
  - this and future.

### Catalog and templates

- Workout Template collection card;
- template block editor;
- catalog result row;
- exercise detail sheet;
- custom exercise validation form;
- neutral image placeholder;
- attribution/license panel.

### History and progress

- history summary card;
- completed workout detail block;
- correction-mode set input;
- `TrendChart` accessible SVG;
- metric card;
- personal-record row;
- textual chart summary.

## 5. Complete screen and route map

| Route | Screen | Reachable from |
|---|---|---|
| `/sign-in` | Minimal private sign-in | Root when signed out; Settings sign-in section |
| `/today` | Active/planned/rest/empty Today states | Primary navigation |
| `/workout/active` | Active Workout | Resume/Start actions; exercise catalog returns here |
| `/plan` | Mobile/desktop Workout Schedule | Primary navigation |
| `/templates` | Workout Template collection | Today Quick Start; Workout Schedule; Active Workout context |
| `/templates/:templateId` | Template editor | Workout Template collection |
| `/exercises` | Catalog + custom exercise | Active Workout; template editor |
| `/history` | Completed workout chronology | Primary navigation; Finish Workout |
| `/history/:workoutId` | Completed workout detail/correction/delete | History list |
| `/progress` | Exercise trends, set history, records | Primary navigation |
| `/settings` | Profile, race goal, units, notifications, install, storage, prototype states | Primary navigation |

The expanded Rest Timer is an overlay state reachable after completing a set and tapping the persistent compact timer.

## 6. Key interactions and state transitions

### Sign in

`Signed out → mocked sign-in submit → signed in on this device → Today`

No public signup or member discovery is presented.

### Start and resume

- There can be exactly one `active` workout.
- Starting a template while an active workout exists is rejected with a calm toast.
- Active state persists in Member-scoped IndexedDB and is restored after reload; an explicit outbox queues changes for sync.
- Today places Resume Active Workout above all other content.

### Set completion

`Target visible → values edited → Complete set pressed → performed set saved locally → rest timer starts → sync state moves to syncing → synced`

Important rules:

- an edited target is not a performed set;
- only `completed: true` sets enter history;
- warm-ups remain recorded but are excluded from records, volume, and trends;
- sync failure/offline state never disables the completion action.

### Rest timer

- Compact timer remains visible while logging continues.
- Expanded timer is optional and dismissible.
- Pause/resume affects countdown only.
- Skip ends the timer without changing set completion.
- ±15 seconds changes the current timer.

### Finish and discard

- Finish shows completed versus target working sets.
- Incomplete targets are omitted from performed history.
- A finished Workout becomes editable completed history.
- Discard requires destructive confirmation and removes the one resumable Active Workout.
- Template changes are never implicit; the prototype states the post-workout Update Template rule.

### Planning

- Past uncompleted plans remain `planned` and unresolved.
- Resolution actions: complete late, reschedule, skip.
- Recurring plan edits require an occurrence scope.
- Desktop uses a seven-column weekly board.
- Mobile uses a touch-friendly day strip plus agenda.

### Corrections and deletion

- Correction mode edits completed sets.
- Save updates the canonical workout state and marks Progress as recalculated.
- Delete removes the workout and exposes immediate Undo through the toast.

### Sync states

- `synced/online → local edit → syncing → synced`.
- `offline → local edit → offline` with no blocked recording.
- `error → retry → syncing → synced`.
- State variants can be inspected in Settings.

## 7. Data consistency notes

The shared state model in `src/state/AppState.tsx` supplies all screens. Mock data is defined in `src/data/mockData.ts`.

Coherent examples include:

- active `Upper Strength B` on Thursday 23 July 2026;
- unresolved planned `Upper Strength B` from Tuesday 21 July;
- recurring `Heavy Legs` on Friday 24 July;
- recurring `Long Run · 12 km easy` on Sunday 26 July;
- completed `Heavy Legs` on 13 and 17 July;
- completed `Upper Strength B` on 18 July;
- completed `Easy Run + Upper A` on 21 July;
- machine-assisted and band-assisted pull-up catalog records;
- strength, paired, and rounds-based Workout Templates;
- Auckland Half Marathon race goal on 1 November 2026.

Load is interpreted per implement/side for dumbbells and carries. Barbell load includes the bar.

## 8. Responsive rules

### Mobile, primary target

- viewport uses `100dvh` and iOS safe-area environment variables;
- bottom navigation has five equal destinations;
- horizontal day strip replaces a compressed calendar grid;
- sheets open from the bottom and preserve large close targets;
- set fields use two-column wrapping and 48 px inputs;
- primary completion action spans the available width;
- persistent timer sits above the bottom navigation;
- no page should require horizontal scrolling except intentional filter/day carousels.

### Tablet and desktop

- navigation becomes a fixed 232 px left rail at `lg`;
- content is capped at 1180 px;
- planning becomes a seven-column weekly board;
- sheets become centered dialogs;
- set input grids expand to four columns where useful;
- template and history cards use two-column layouts when space supports them;
- Active Workout remains capped at 900 px to preserve scanability.

## 9. Accessibility considerations

- Minimum 44 px touch targets; primary actions are 56 px.
- Visible `:focus-visible` ring with strong contrast.
- Semantic landmarks: header, main, nav, section, article, aside.
- Icon-only controls include `aria-label` text.
- Dialog focus handling, escape dismissal, and focus return come from Radix.
- Dropdown and tab keyboard behaviour come from Radix primitives.
- Form controls have explicit labels or accessible names.
- Color is not the sole status indicator; states include icons and copy.
- Chart includes SVG title/description and a visible textual summary.
- Warm-up exclusion is expressed in text, not only styling.
- Motion respects `prefers-reduced-motion`.
- Dark palette is designed for WCAG-oriented contrast; production should run automated and manual contrast checks after final branding.
- Destructive actions require confirmation; deletion offers Undo.

## 10. Architecture and handoff notes

### File structure

```text
src/
  components/
    charts/TrendChart.tsx
    layout/AppShell.tsx
    layout/LoadingScreen.tsx
    layout/SyncStatus.tsx
    layout/Toast.tsx
    ui/Button.tsx
    ui/FormField.tsx
    ui/Sheet.tsx
    ui/Surface.tsx
    workout/ExerciseCard.tsx
    workout/RestTimer.tsx
    workout/SetRow.tsx
  data/mockData.ts
  pages/*
  state/AppState.tsx
  App.tsx
  lib.ts
  styles.css
  types.ts
```

### State boundary

`AppStateProvider` intentionally models the product rules in one place. Codex should preserve this logical boundary when replacing local mock state with production repositories/services.

Recommended production separation:

- domain entities and calculations;
- local persistence adapter;
- sync queue and conflict strategy;
- authenticated API adapter;
- notification adapter;
- view-specific selectors.

### Dependency posture

Dependencies are deliberately modest:

- React / React DOM;
- React Router;
- Tailwind Vite integration;
- focused Radix primitives only;
- Lucide icons;
- `clsx`.

The chart is custom SVG to avoid a chart package for two simple trend views.

## 11. Assumptions

- one authenticated Member;
- one active workout at a time;
- metric defaults: kg and km;
- dates in the mock are Auckland-local dates;
- local persistence is sufficient for prototype recovery;
- no merge-conflict UI is required for a single-device prototype;
- catalog metadata is represented locally and neutral illustration placeholders are acceptable;
- notification permission can be represented without invoking the browser permission API;
- installed-state detection is represented as guidance, not implemented detection.

## 12. Deliberately deferred

The following are explicitly not implemented:

- real backend, auth provider, database, or server sync;
- service worker, background sync, or push server;
- multiple members, invitations, social, sharing, leaderboards, public profiles;
- AI chat or recommendations;
- Fitbod import;
- export and backup administration;
- Apple Health or calendar integrations;
- GPS route tracking;
- exercise videos or copyrighted imagery;
- programmable interval/HIIT timers;
- payments or subscriptions;
- production conflict resolution, schema migration, analytics, or error reporting.

## 13. Production acceptance checklist

Before implementation is considered production-ready, preserve and test these behaviours:

- exactly one resumable active workout;
- local write completes before sync is attempted;
- offline and sync error cannot block set completion;
- target values never count without explicit confirmation;
- warm-up sets stay in history and stay out of Progress;
- active workout divergence does not mutate templates;
- completed workout corrections recalculate Progress;
- recurring plan edits require scope;
- iPhone safe areas, keyboard opening, and bottom timer/nav stacking;
- VoiceOver order and labels for set completion, timer, sheets, and destructive confirmations;
- 320 px width has no unintended overflow;
- charts retain textual summaries and keyboard-readable exercise selection.

# Barely Fit private-beta scope

## Outcome

Build Barely Fit, a private, phone-first progressive web app that can replace Fitbod for one Member's day-to-day workout planning, logging, and progress review. The private beta will be used primarily on an iPhone 16 Pro through Chrome and installed on the Home Screen, with a responsive desktop experience for planning and analysis.

## Private-beta capabilities

### Access and platform

- One private Member account with a long-lived, silently renewed session.
- Public GitHub source with no private data or server secrets in the repository or browser bundle.
- Installable iPhone PWA with opt-in push notifications.
- Responsive desktop support.
- Supabase Free for Postgres, authentication, and Row Level Security; Cloudflare Free for static hosting; IndexedDB plus an outbox for offline-first use. See [ADR 0003](adr/0003-free-managed-pwa-stack.md).

### Today and workout execution

- A Today screen prioritizing Resume Active Workout, today's Planned Workout, Quick Start or a Workout Template, and a compact progress summary.
- Exactly one resumable Active Workout, with every change saved locally immediately.
- Workout Templates that can be changed freely during a Workout without silently changing the source Template.
- An explicit option to update a Template after a Workout.
- Exercise Blocks supporting single Exercises, supersets, and circuits.
- Adding, replacing, removing, and reordering Exercises and Sets during a Workout.
- Set Targets prefilled from the Template or prior performance; nothing enters Workout History until explicitly completed.
- Warm-up and Working Sets, with warm-ups excluded from Progress calculations.
- Optional Repetitions in Reserve for strength Sets.
- Weight-and-repetition, bodyweight-and-repetition, assisted, duration, and distance-plus-duration measurements.
- Load entered per implement or side; barbell Load includes the bar.
- Numeric machine Assistance or a named resistance band, without false conversion between them.
- Member defaults of kilograms and kilometres.
- An Exercise-specific Rest Timer that begins after Set completion, plus passive Workout Duration.
- Background timer alerts when the installed PWA has notification permission.

### Planning

- A weekly Workout Schedule showing history and future Planned Workouts.
- Future and optionally recurring Planned Workouts.
- Editing one recurrence or that occurrence and future occurrences.
- Past uncompleted plans remain unresolved until completed late, rescheduled, or explicitly marked Skipped.
- Optional Workout Reminders.

### Exercises

- A locally available, curated snapshot of wger Exercises with instructions, muscles, equipment, provenance, and only individually verified reusable still images. See [ADR 0004](adr/0004-use-a-curated-wger-catalog-snapshot.md).
- Required content attribution available offline.
- Private Custom Exercises for catalog gaps.

### History and progress

- Chronological Workout History with editable and deletable completed Workouts.
- Exercise-level Set history.
- Personal Records for applicable weight, repetition, duration, and distance measurements.
- Estimated one-repetition maximum for weighted strength Exercises.
- Training Volume and measurement-specific trend charts.
- A Training Profile containing goals, available equipment, preferred duration and frequency, Exercise preferences, and physical limitations.
- Race Goals containing event name, date, distance, and optional target time.

## Primary navigation

- Today
- Plan
- History
- Progress
- Settings

## Explicitly deferred

- Additional Members, invitations, removal, and shared-account administration.
- Private Custom GPT Workout Recommendations.
- Fitbod Import.
- User-facing export and formal backup automation.
- Apple Health, GPS route tracking, and native iOS integration.
- External calendar synchronization.
- Exercise video hosting.
- Programmable interval or HIIT timers.

## Release constraints

- Core workout logging must remain usable without internet.
- Sync must be automatic, idempotent, and visible without blocking an Active Workout.
- Private data must be protected by database Row Level Security rather than hidden UI alone.
- The interface must be fast with one hand, minimize typing, respect iPhone safe areas, and use large touch targets.
- Free-tier policies and current stable dependencies must be rechecked immediately before deployment.

## Acceptance checkpoint

The beta is successful when the Member can install it, remain signed in, plan a week, complete and recover an offline Workout with timers, review accurate history and Progress, and use it as the primary workout logger for one month.

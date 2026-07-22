# ChatGPT design prompt

Copy everything inside the following block into ChatGPT:

```text
Act as a senior product designer and front-end prototyper. Create a polished, high-fidelity, interactive code prototype for a private workout-tracking progressive web app. I will give the exported source to Codex for production implementation, so make the result systematic, component-based, responsive, and easy to inspect—not merely a collection of static screenshots.

DELIVERABLE

Build the prototype in Canvas as a React + TypeScript application using current stable tooling, Tailwind CSS, accessible headless UI patterns, Lucide-style icons, and a lightweight chart library if needed. Use mock data and client-side interactions only. Do not implement a real backend, authentication provider, database, service worker, or push server. Keep dependencies modest.

Also include a DESIGN-HANDOFF.md containing:
- visual principles and rationale;
- color, typography, spacing, radius, shadow, and motion tokens;
- component inventory and variants;
- complete screen/route map;
- key interaction and state-transition notes;
- mobile/desktop responsive rules;
- accessibility considerations;
- assumptions and deliberately deferred features.

Use CSS variables or equivalent design tokens rather than scattering raw values. Provide all source files and concise run instructions. The product name is Barely Fit; use a simple text mark and do not spend time on a complex permanent logo.

PRODUCT AND AUDIENCE

This is a solo private beta intended to replace Fitbod for one person. The critical device is an iPhone 16 Pro using Chrome with the PWA installed on the Home Screen. It should also have a strong responsive desktop layout for planning workouts and reviewing charts. Design for sweaty hands, gym lighting, interruptions, minimal typing, one-handed use, iPhone safe areas, and large touch targets of at least 44px.

Exercise strong visual judgment. Create a distinctive, premium fitness-tool aesthetic without looking like a generic admin dashboard, bodybuilding social network, or neon gaming interface. Favor clarity, speed, high contrast, disciplined typography, and one restrained accent color. Dark-first is appropriate for gym use, but ensure excellent contrast and a coherent light-mode-ready token system. Make data dense only where it speeds up workout logging.

PRIMARY NAVIGATION

Use a mobile bottom navigation and an appropriate desktop adaptation with these destinations:
- Today
- Plan
- History
- Progress
- Settings

SCREENS AND FLOWS

1. Sign in
- Minimal private-account sign-in screen.
- Communicate that the device will remain signed in.
- Do not expose public signup or multi-member features.

2. Today
- Order content by urgency: Resume Active Workout, today's Planned Workout, Quick Start or choose a Workout Template, then a compact recent-progress summary.
- Show clear offline/sync state without making it alarming.
- Include useful empty, rest-day, scheduled-day, and Active Workout variants.

3. Active Workout
- Persistent Workout Duration and discreet offline/sync indicator.
- Ordered Exercise Blocks that support a single Exercise, superset, or circuit.
- Each Exercise shows prior performance beside today's Set Targets.
- Set rows support Warm-up or Working classification and the applicable fields: Load, repetitions, Assistance, duration, distance, notes, and optional RIR.
- Load is entered per implement or side; barbell Load includes the bar.
- Assistance may be numeric for a machine or a named resistance band.
- Nothing counts until a large, explicit Complete Set action is pressed.
- Completing a Set starts the Exercise-specific Rest Timer.
- Make adding a Set, adding/replacing/reordering an Exercise, and editing targets easy without crowding the main flow.
- Include Finish Workout, discard confirmation, and recovery after closing the app.

4. Rest Timer
- Design a compact persistent timer plus an expanded sheet or overlay.
- Support add/subtract time, skip, pause where appropriate, sound/vibration state, and the next Set preview.
- The timer must coexist with continued logging rather than blocking the whole screen.

5. Plan
- Weekly layout containing past and future Workouts.
- Planned Workouts may recur weekly.
- Past uncompleted plans remain visibly unresolved until completed late, rescheduled, or marked Skipped.
- Include creating, moving, rescheduling, and editing one occurrence versus this-and-future occurrences.
- Make the mobile weekly view genuinely usable rather than shrinking a desktop calendar.

6. Workout Templates
- Template library and editor.
- Add and reorder Exercise Blocks, create supersets/circuits, configure Set Targets, and set default rest duration.
- Changes made in an Active Workout do not alter the Template unless Update Template is explicitly chosen afterward.

7. Exercise Catalog and Custom Exercise
- Search and filter by muscles and equipment.
- Catalog records include instructions, primary/secondary muscles, equipment, and an optional still illustration.
- Include a discreet attribution/license area because catalog content comes from a curated local wger snapshot.
- Do not hotlink or invent copyrighted exercise imagery; use clearly labeled neutral placeholders in the prototype.
- Support creating a private Custom Exercise with its measurement type and metadata.

8. History
- Chronological completed Workouts with useful summaries.
- Workout detail shows Exercise Blocks and every performed Set.
- Completed Workouts can be corrected or deleted, with clear confirmation and undo patterns.

9. Progress
- Exercise selector/search.
- Exercise Set history.
- Personal Records for applicable Load, repetitions, duration, and distance.
- Estimated one-repetition maximum for weighted strength Exercises.
- Training Volume over time and measurement-specific trend charts.
- Charts must remain legible on a phone and include accessible textual summaries.

10. Training Profile and Settings
- Goals, available equipment, preferred workout length and weekly frequency, preferred/avoided Exercises, and physical limitations.
- Race Goals with event name, date, distance, and optional target time.
- kg and km defaults.
- Notification permission/status for Rest Timers and Workout Reminders.
- PWA installation guidance when not installed.
- Account/session and offline storage status.

DATA AND STATE RULES TO REFLECT IN THE PROTOTYPE

- There is exactly one resumable Active Workout.
- Every workout edit is saved locally immediately and syncs later.
- Set Targets are not completed Sets until explicitly confirmed.
- Warm-up Sets remain in history but do not count toward Progress.
- Working Sets drive Personal Records, Training Volume, and trends.
- A Workout may diverge freely from its Template.
- Completed Workouts remain editable, and Progress reflects corrections.
- Show realistic states for online, offline, syncing, sync success, recoverable sync failure, empty content, loading, validation errors, and destructive confirmation.
- Never let a sync problem block recording a Workout.

MOCK DATA

Use coherent realistic mock data across every screen: a few strength Workout Templates, one superset, one circuit, recent completed Workouts, upcoming Planned Workouts, Personal Records, a running Race Goal, a machine-assisted Exercise, and a band-assisted pull-up. Use kg and km. Ensure the same Exercises, dates, and performance numbers agree across Today, Plan, History, and Progress.

OUT OF SCOPE—DO NOT ADD THESE TO THE PROTOTYPE

- Multiple Members, invitations, social features, sharing, leaderboards, or public profiles.
- AI chat or Custom GPT recommendations.
- Fitbod import.
- Data export or backup administration.
- Apple Health or external calendar integration.
- GPS route tracking.
- Exercise videos.
- Programmable interval/HIIT timers.
- Payments or subscriptions.

QUALITY BAR

The prototype should feel believable enough to test during a real workout. Prioritize the Active Workout, Complete Set, Rest Timer, weekly planning, and offline recovery interactions. Avoid placeholder lorem ipsum, giant decorative gradients, excessive glassmorphism, tiny controls, and dashboard cards that do not support a user task. Use progressive disclosure so advanced controls do not slow down ordinary Set logging.

Before finishing, verify that all listed screens are reachable, mobile layouts do not overflow, the mock interactions work, and the design handoff matches the code.
```

# Workout Tracking

A personal fitness context for planning workouts, recording completed training, and understanding progress over time.

## Language

**Member**:
An invited person who may use the application, with fitness data kept separate from every other Member.
_Avoid_: Owner, user, account

**Administrator**:
The single Member who may invite new Members to the application.
_Avoid_: Owner, superuser

**Workout Template**:
A reusable plan containing Exercises and intended Set or repetition targets for a future Workout. Changes made while performing a Workout do not alter its Template unless the Member explicitly chooses to update it.
_Avoid_: Routine, preset

**Workout**:
A single flexible training session that can be in progress or completed and records the Exercises and Sets actually performed, even when they differ from its Template. A Member may correct or delete their own completed Workouts, and Progress reflects the corrected history.
_Avoid_: Session, activity

**Active Workout**:
The Member's sole in-progress Workout, automatically preserved until it is completed or explicitly discarded.
_Avoid_: Draft workout, open session

**Planned Workout**:
A Workout Template assigned to a future date for a Member but not yet started. After its date passes, it remains unresolved until completed late, rescheduled, or marked Skipped.
_Avoid_: Scheduled session, calendar event

**Skipped Workout**:
A Planned Workout that its Member explicitly chose not to complete.
_Avoid_: Failed workout, missed workout

**Workout Schedule**:
A Member's dated past and future Workouts presented as a weekly training layout, including optional recurring Planned Workouts.
_Avoid_: Calendar, program

**Workout Reminder**:
An optional notification chosen by a Member for an upcoming Planned Workout.
_Avoid_: Alert, calendar notification

**Exercise**:
A named movement that can be planned in a Workout Template and performed during a Workout.
_Avoid_: Movement

**Exercise Catalog**:
The shared, curated collection of Exercises available to every Member, including instructions, muscle and equipment metadata, and an optional still illustration.
_Avoid_: Exercise library, movement database

**Custom Exercise**:
An Exercise created by a Member for their own use and visible only to that Member.
_Avoid_: Private movement, user exercise

**Exercise Block**:
An ordered part of a Workout Template or Workout containing one Exercise or multiple Exercises performed together in repeated rounds.
_Avoid_: Superset, circuit, group

**Set**:
One recorded effort for an Exercise, using the Exercise's applicable measurements: repetitions, Load, assistance, duration, distance, notes, and optional Repetitions in Reserve for strength work.
_Avoid_: Entry, result

**Set Target**:
An intended measurement for a future Set, derived from a Workout Template or prior performance and excluded from Workout History until the Member explicitly completes it.
_Avoid_: Prefilled set, suggested set

**Load**:
The resistance shown for one implement or used on one side of an Exercise; for a barbell, it is the total weight including the bar. The Exercise determines how that value contributes to Training Volume.
_Avoid_: Combined weight, total weight

**Assistance**:
Help applied to an Exercise, recorded either as a numeric machine value or as a named resistance band. Results using different assistance forms are not treated as directly comparable.
_Avoid_: Negative Load, converted band weight

**Repetitions in Reserve**:
A Member's estimate of how many additional good repetitions they could have performed at the end of a strength Set.
_Avoid_: RPE, effort score

**Warm-up Set**:
A preparatory Set retained in Workout History but excluded from Training Volume, Personal Records, and recommendation evidence.
_Avoid_: Practice set

**Working Set**:
A Set intended to provide the Exercise's primary training stimulus and included in Progress calculations.
_Avoid_: Main set

**Workout History**:
The chronological record of completed Workouts.
_Avoid_: Activity log

**Progress**:
Change in recorded performance across completed Workouts, shown through Exercise history, Personal Records, estimated one-repetition maximum, Training Volume, and measurement-specific trends.
_Avoid_: Analytics, gains

**Personal Record**:
A Member's best recorded performance for an Exercise according to an applicable measurement such as weight, repetitions, duration, or distance.
_Avoid_: Best, PR event

**Training Volume**:
The total weighted work recorded across applicable Sets over a period of time.
_Avoid_: Workload

**Workout Recommendation**:
A proposed Workout generated for the Administrator by their private Custom GPT using only the Administrator's permitted fitness data. It remains a draft until the Administrator explicitly approves it as a Workout Template.
_Avoid_: AI workout, generated workout

**Training Profile**:
A Member's fitness goals, available equipment, preferred workout length and frequency, Exercise preferences, and physical limitations that shape suitable training.
_Avoid_: Settings, AI profile

**Race Goal**:
An upcoming running event identified by name, date, distance, and optional target time that may shape Workout Recommendations.
_Avoid_: Running plan, event reminder

**Fitbod Import**:
A one-time transfer of a Member's available historical Fitbod training records into their Workout History.
_Avoid_: Sync, integration

**Rest Timer**:
A countdown between Sets that may have an Exercise-specific default and alerts the person when rest is complete.
_Avoid_: Timer, interval timer

**Workout Duration**:
The elapsed time from the start to the completion of a Workout.
_Avoid_: Workout timer

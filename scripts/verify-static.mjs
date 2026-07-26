import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const requiredFiles = [
  'src/App.tsx',
  'src/state/AppState.tsx',
  'src/state/persistence.ts',
  'src/state/remoteState.ts',
  'src/lib/supabase.ts',
  'src/data/mockData.ts',
  'src/pages/SignInPage.tsx',
  'src/pages/TodayPage.tsx',
  'src/pages/ActiveWorkoutPage.tsx',
  'src/pages/WorkoutSchedulePage.tsx',
  'src/pages/TemplatesPage.tsx',
  'src/pages/TemplateEditorPage.tsx',
  'src/pages/ExerciseCatalogPage.tsx',
  'src/pages/HistoryPage.tsx',
  'src/pages/WorkoutDetailPage.tsx',
  'src/pages/ProgressPage.tsx',
  'src/domain/progress.ts',
  'src/domain/workoutSchedule.ts',
  'src/pages/SettingsPage.tsx',
  'DESIGN-HANDOFF.md',
  'public/manifest.webmanifest',
  'public/sw.js',
  '.env.example',
  'supabase/functions/send-rest-notifications/index.ts',
  'supabase/migrations/20260724000000_rest_timer_notifications.sql',
  'supabase/config.toml',
  'supabase/migrations/20260723000000_private_member_state.sql',
  'supabase/tests/member_state_rls.test.sql',
  '.github/workflows/release.yml',
  'docs/private-beta-operations.md',
  'scripts/verify-release.mjs',
];

const routes = [
  '/sign-in', '/today', '/workout/active', '/plan', '/templates',
  '/templates/:templateId', '/exercises', '/history', '/history/:workoutId',
  '/progress', '/settings',
];

const errors = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required file: ${file}`);
}

const appSource = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
for (const route of routes) {
  if (!appSource.includes(`path="${route}"`)) errors.push(`Missing route: ${route}`);
}

const stateSource = fs.readFileSync(path.join(root, 'src/state/AppState.tsx'), 'utf8');
for (const rule of ['status === \'active\'', 'savePersistedState', "type: 'update-set-draft'", "type: 'complete-set'", "type: 'timer-tick'", "type: 'correct-completed-workout'", "type: 'save-template'", "type: 'update-template-from-workout'", "type: 'reschedule-planned-workout'"]) {
  if (!stateSource.includes(rule)) errors.push(`State rule not found: ${rule}`);
}
const workoutScheduleSource = fs.readFileSync(path.join(root, 'src/domain/workoutSchedule.ts'), 'utf8');
for (const rule of ['planWorkoutTemplate', 'reschedulePlannedWorkout', 'startPlannedWorkout', 'workoutSchedule', 'recurrenceSeriesId', 'recurrenceEndDate', 'plannedDate']) {
  if (!workoutScheduleSource.includes(rule)) errors.push(`Workout Schedule rule not found: ${rule}`);
}
const todaySource = fs.readFileSync(path.join(root, 'src/pages/TodayPage.tsx'), 'utf8');
for (const rule of ["workoutId: todayPlannedWorkout.id", 'calculateRecentProgress', 'recentProgress.fourWeekTrainingVolume', 'recentProgress.recentDistance']) {
  if (!todaySource.includes(rule)) errors.push(`Today data rule not found: ${rule}`);
}
const progressSource = fs.readFileSync(path.join(root, 'src/pages/ProgressPage.tsx'), 'utf8');
if (!progressSource.includes('calculateExerciseProgress')) errors.push('Progress must use the shared calculation module.');
const persistenceSource = fs.readFileSync(path.join(root, 'src/state/persistence.ts'), 'utf8');
for (const rule of ['indexedDB.open', "const OUTBOX_STORE = 'outbox'", 'queueForSync']) {
  if (!persistenceSource.includes(rule)) errors.push(`Persistence rule not found: ${rule}`);
}

const supabaseSource = fs.readFileSync(path.join(root, 'src/lib/supabase.ts'), 'utf8');
for (const rule of ['createClient', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'autoRefreshToken: true', 'persistSession: true', 'validateMemberSession', 'assert_authorized_member']) {
  if (!supabaseSource.includes(rule)) errors.push(`Supabase client rule not found: ${rule}`);
}
if (/service[_-]?role/i.test(supabaseSource)) errors.push('Supabase client must not include a service-role credential.');
const environmentExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
if (!environmentExample.includes('VITE_VAPID_PUBLIC_KEY')) errors.push('Web Push public-key configuration is missing.');
const remoteStateSource = fs.readFileSync(path.join(root, 'src/state/remoteState.ts'), 'utf8');
for (const rule of ['member_state', '.eq(\'member_id\'', '.upsert']) {
  if (!remoteStateSource.includes(rule)) errors.push(`Remote state rule not found: ${rule}`);
}
const migrationSource = fs.readFileSync(path.join(root, 'supabase/migrations/20260723000000_private_member_state.sql'), 'utf8');
for (const rule of ['enable row level security', 'force row level security', 'auth.uid()', 'is_authorized_member', 'assert_authorized_member', 'to authenticated']) {
  if (!migrationSource.includes(rule)) errors.push(`RLS migration rule not found: ${rule}`);
}
const rlsTestSource = fs.readFileSync(path.join(root, 'supabase/tests/member_state_rls.test.sql'), 'utf8');
for (const rule of ['select plan(6)', 'unapproved identity cannot create', 'client authorization check', 'cannot read another Member state', 'cannot update another Member state']) {
  if (!rlsTestSource.includes(rule)) errors.push(`RLS test rule not found: ${rule}`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'));
if (manifest.display !== 'standalone') errors.push('Manifest must use standalone display.');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) errors.push('Manifest icons are incomplete.');
if (manifest.start_url !== './' || manifest.scope !== './') errors.push('Manifest must remain within its deployment scope.');

const viteSource = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
if (!viteSource.includes("mode === 'e2e' ? '/barely-fit/' : '/'")) errors.push('Cloudflare production and nested E2E base paths are missing.');
const mainSource = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8');
if (!mainSource.includes('basename={import.meta.env.BASE_URL}')) errors.push('Router deployment basename is missing.');
const releaseWorkflow = fs.readFileSync(path.join(root, '.github/workflows/release.yml'), 'utf8');
for (const rule of ['pnpm test:browser', 'pnpm verify:release', 'supabase db start', 'supabase test db --local', 'cloudflare/wrangler-action@', 'pages deploy dist --project-name=barely-fit']) {
  if (!releaseWorkflow.includes(rule)) errors.push(`Release workflow rule not found: ${rule}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Static verification passed: ${requiredFiles.length} files, ${routes.length} routes, local-first state rules, and manifest.`);

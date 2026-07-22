import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const requiredFiles = [
  'src/App.tsx',
  'src/state/AppState.tsx',
  'src/state/persistence.ts',
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
  'src/pages/SettingsPage.tsx',
  'DESIGN-HANDOFF.md',
  'public/manifest.webmanifest',
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
for (const rule of ['status === \'active\'', 'savePersistedState', "type: 'update-set-draft'", "type: 'complete-set'", "type: 'timer-tick'", "type: 'correct-completed-set'", "type: 'save-template'", "type: 'update-template-from-workout'", "type: 'reschedule-planned-workout'", 'recurrenceSeriesId', 'recurrenceEndDate']) {
  if (!stateSource.includes(rule)) errors.push(`State rule not found: ${rule}`);
}
const todaySource = fs.readFileSync(path.join(root, 'src/pages/TodayPage.tsx'), 'utf8');
for (const rule of ["workoutId: todayPlannedWorkout.id", 'fourWeekVolume', 'recentRun']) {
  if (!todaySource.includes(rule)) errors.push(`Today data rule not found: ${rule}`);
}
const persistenceSource = fs.readFileSync(path.join(root, 'src/state/persistence.ts'), 'utf8');
for (const rule of ['indexedDB.open', "const OUTBOX_STORE = 'outbox'", 'queueForSync']) {
  if (!persistenceSource.includes(rule)) errors.push(`Persistence rule not found: ${rule}`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'));
if (manifest.display !== 'standalone') errors.push('Manifest must use standalone display.');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) errors.push('Manifest icons are incomplete.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Static verification passed: ${requiredFiles.length} files, ${routes.length} routes, local-first state rules, and manifest.`);
